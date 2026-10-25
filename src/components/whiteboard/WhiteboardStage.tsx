import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Stage, 
  Layer, 
  Line as KonvaLine, 
  Rect as KonvaRect, 
  Circle as KonvaCircle, 
  Ellipse as KonvaEllipse,
  Text as KonvaText, 
  Star as KonvaStar, 
  Arrow as KonvaArrow, 
  Group as KonvaGroup, 
  Transformer,
  Image as KonvaImage
} from 'react-konva';
import type Konva from 'konva';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { collaborationService } from '@/services/collaborationService';
import { 
  CanvasElement, 
  StrokeElement, 
  ShapeElement, 
  TextElement, 
  StickyElement, 
  FormulaElement,
  ImageElement,
  GraphElement,
  TableElement,
  FlowchartNodeElement,
  MindmapNodeElement,
  Point
} from '@/types/whiteboard';
import { 
  CanvasGraphItem, 
  CanvasTableItem, 
  CanvasFlowchartItem, 
  CanvasMindmapItem 
} from './WhiteboardElements';

export interface WhiteboardStageProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

// Helper image component for Konva rendering
const CanvasImageItem: React.FC<{
  element: ImageElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}> = ({ element, onSelect, onTransformEnd, onDragEnd }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = element.src;
    img.onload = () => setImage(img);
  }, [element.src]);

  return (
    <KonvaImage
      id={element.id}
      image={image || undefined}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      opacity={element.opacity !== undefined ? element.opacity : 1}
      draggable={true}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};

export const WhiteboardStage: React.FC<WhiteboardStageProps> = ({ stageRef }) => {
  const {
    project,
    activePage,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    strokeOpacity,
    fillColor,
    fontFamily,
    fontSize,
    stickyColor,
    eraserMode,
    scale,
    setScale,
    stagePos,
    setStagePos,
    addElement,
    updateElement,
    deleteElement,
    selectedElementIds,
    setSelectedElementIds,
    isFocusMode,
  } = useWhiteboard();

  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Transient in-progress drawing states
  const isPointerDown = useRef(false);
  const isSpacePanning = useRef(false);
  const startPointRef = useRef<Point>({ x: 0, y: 0 });
  const [transientElement, setTransientElement] = useState<CanvasElement | null>(null);

  // Marquee selection box state
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Inline text editing state
  const [editingText, setEditingText] = useState<{
    id: string;
    type: 'text' | 'sticky';
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontColor: string;
  } | null>(null);

  // Laser pointer vanishing trail
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  // Update canvas dimensions dynamically with ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth || window.innerWidth,
          height: containerRef.current.offsetHeight || window.innerHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, [isFocusMode]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        isSpacePanning.current = true;
        if (stageRef.current) {
          stageRef.current.container().style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePanning.current = false;
        if (stageRef.current) {
          stageRef.current.container().style.cursor = getCursorForTool(tool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool, stageRef]);

  // Update Konva Transformer nodes when selectedElementIds change
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (tool === 'select' && selectedElementIds.length > 0) {
      const nodes: Konva.Node[] = [];
      for (const id of selectedElementIds) {
        const node = stageRef.current.findOne('#' + id);
        if (node) nodes.push(node);
      }
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementIds, tool, stageRef, activePage.elements]);

  // Determine stage cursor based on active tool
  function getCursorForTool(t: string): string {
    switch (t) {
      case 'select': return 'default';
      case 'pan': return 'grab';
      case 'pen':
      case 'highlighter': return 'crosshair';
      case 'eraser': return 'cell';
      case 'text': return 'text';
      case 'sticky': return 'copy';
      case 'shape': return 'crosshair';
      case 'laser': return 'none';
      default: return 'default';
    }
  }

  // Handle Wheel: pinch-to-zoom (with ctrl) or 2D pan
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom towards mouse pointer
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const zoomFactor = e.evt.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.min(5, Math.max(0.15, Number((oldScale * zoomFactor).toFixed(2))));

      setScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    } else {
      // 2D Pan
      setStagePos(prev => ({
        x: prev.x - e.evt.deltaX,
        y: prev.y - e.evt.deltaY,
      }));
    }
  };

  // Convert screen coordinates to world coordinates
  const getWorldPointerPos = useCallback((): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;
    return {
      x: (pointerPos.x - stagePos.x) / scale,
      y: (pointerPos.y - stagePos.y) / scale,
    };
  }, [scale, stagePos, stageRef]);

  // Pointer Down handler
  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Check if middle click or space key is pressed for panning
    if ((e.evt as MouseEvent).button === 1 || isSpacePanning.current || tool === 'pan') {
      stage.container().style.cursor = 'grabbing';
      isPointerDown.current = true;
      const pointer = stage.getPointerPosition();
      if (pointer) {
        startPointRef.current = { x: pointer.x - stagePos.x, y: pointer.y - stagePos.y };
      }
      return;
    }

    const worldPos = getWorldPointerPos();
    if (!worldPos) return;

    isPointerDown.current = true;
    startPointRef.current = worldPos;

    // Selection tool: marquee selection or deselection
    if (tool === 'select') {
      if (e.target === stage) {
        // Clicked background -> clear selection and start marquee
        setSelectedElementIds([]);
        setMarquee({ x: worldPos.x, y: worldPos.y, width: 0, height: 0 });
      }
      return;
    }

    // Pen & Highlighter: start transient stroke
    if (tool === 'pen' || tool === 'highlighter') {
      const pressure = (e.evt as any).pressure ? Math.max(0.4, (e.evt as any).pressure * 1.5) : 1;
      const effectiveSize = (tool === 'highlighter' ? strokeWidth * 3.5 : strokeWidth) * pressure;

      const newStroke: StrokeElement = {
        id: 'stroke_' + Math.random().toString(36).substring(2, 9),
        type: tool,
        x: 0,
        y: 0,
        points: [worldPos.x, worldPos.y],
        color: strokeColor,
        size: effectiveSize,
        opacity: tool === 'highlighter' ? 0.35 : strokeOpacity,
        tension: 0.45,
        lineCap: tool === 'highlighter' ? 'square' : 'round',
        lineJoin: 'round',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTransientElement(newStroke);
      return;
    }

    // Shape tool: start transient shape
    if (tool === 'shape') {
      const newShape: ShapeElement = {
        id: 'shape_' + Math.random().toString(36).substring(2, 9),
        type: 'shape',
        shapeType,
        x: worldPos.x,
        y: worldPos.y,
        width: 1,
        height: 1,
        stroke: strokeColor,
        strokeWidth,
        fill: fillColor,
        opacity: strokeOpacity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTransientElement(newShape);
      return;
    }

    // Text tool: click to create in-place text
    if (tool === 'text') {
      const newId = 'text_' + Math.random().toString(36).substring(2, 9);
      const newText: TextElement = {
        id: newId,
        type: 'text',
        x: worldPos.x,
        y: worldPos.y,
        text: 'Type text here...',
        fontSize,
        fontFamily,
        fontColor: strokeColor,
        opacity: strokeOpacity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(newText);
      setSelectedElementIds([newId]);
      // Open inline editor immediately
      setEditingText({
        id: newId,
        type: 'text',
        x: worldPos.x,
        y: worldPos.y,
        width: 200,
        height: 40,
        text: '',
        fontSize,
        fontFamily,
        fontColor: strokeColor,
      });
      isPointerDown.current = false;
      return;
    }

    // Sticky Note tool: click to place sticky note
    if (tool === 'sticky') {
      const newId = 'sticky_' + Math.random().toString(36).substring(2, 9);
      const newSticky: StickyElement = {
        id: newId,
        type: 'sticky',
        x: worldPos.x,
        y: worldPos.y,
        text: 'New Sticky Note',
        color: stickyColor,
        width: 160,
        height: 140,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(newSticky);
      setSelectedElementIds([newId]);
      isPointerDown.current = false;
      return;
    }

    // Laser pointer
    if (tool === 'laser') {
      setLaserTrail([{ x: worldPos.x, y: worldPos.y, id: Date.now() }]);
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Pan with spacebar or middle click or pan tool
    if (isPointerDown.current && (isSpacePanning.current || tool === 'pan' || (e.evt as MouseEvent).buttons === 4)) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        setStagePos({
          x: pointer.x - startPointRef.current.x,
          y: pointer.y - startPointRef.current.y,
        });
      }
      return;
    }

    const worldPos = getWorldPointerPos();
    if (!worldPos) return;

    // Broadcast cursor position to collaborators
    if (project?.id && activePage?.id && user?.uid) {
      collaborationService.broadcastCursor(project.id, {
        uid: user.uid,
        displayName: user.displayName || 'Collaborator',
        email: user.email || '',
        color: '#a3e635',
        x: worldPos.x,
        y: worldPos.y,
        pageId: activePage.id,
        lastActive: Date.now(),
      });
    }

    // Laser trail updates
    if (tool === 'laser') {
      const pt = { x: worldPos.x, y: worldPos.y, id: Date.now() };
      setLaserTrail(prev => [...prev.slice(-16), pt]);
      setTimeout(() => {
        setLaserTrail(prev => prev.filter(p => Date.now() - p.id < 450));
      }, 450);
      return;
    }

    if (!isPointerDown.current) return;

    // Marquee dragging
    if (tool === 'select' && marquee) {
      const width = worldPos.x - marquee.x;
      const height = worldPos.y - marquee.y;
      setMarquee(prev => prev ? { ...prev, width, height } : null);
      return;
    }

    // Eraser mode
    if (tool === 'eraser') {
      const radius = (strokeWidth * 3) / scale;
      const toDelete: string[] = [];

      for (const el of activePage.elements) {
        if (el.type === 'pen' || el.type === 'highlighter') {
          const stroke = el as StrokeElement;
          for (let i = 0; i < stroke.points.length; i += 2) {
            const px = stroke.points[i];
            const py = stroke.points[i + 1];
            if (Math.hypot(px - worldPos.x, py - worldPos.y) < radius) {
              toDelete.push(el.id);
              break;
            }
          }
        } else if (eraserMode === 'object') {
          // Bounding box hit test in object eraser mode
          const w = (el as any).width || 80;
          const h = (el as any).height || 80;
          if (
            worldPos.x >= (el as any).x - radius &&
            worldPos.x <= (el as any).x + w + radius &&
            worldPos.y >= (el as any).y - radius &&
            worldPos.y <= (el as any).y + h + radius
          ) {
            toDelete.push(el.id);
          }
        }
      }

      if (toDelete.length > 0) {
        for (const id of toDelete) {
          deleteElement(id);
        }
      }
      return;
    }

    // Pen & Highlighter stroke appending
    if ((tool === 'pen' || tool === 'highlighter') && transientElement) {
      const current = transientElement as StrokeElement;
      const newPoints = current.points.concat([worldPos.x, worldPos.y]);
      setTransientElement({
        ...current,
        points: newPoints,
      });
      return;
    }

    // Shape sizing
    if (tool === 'shape' && transientElement) {
      const current = transientElement as ShapeElement;
      let width = worldPos.x - startPointRef.current.x;
      let height = worldPos.y - startPointRef.current.y;

      // Hold Shift to lock 1:1 aspect ratio
      if ((e.evt as MouseEvent).shiftKey) {
        const side = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -side : side;
        height = height < 0 ? -side : side;
      }

      setTransientElement({
        ...current,
        width: Math.abs(width),
        height: Math.abs(height),
        x: width < 0 ? worldPos.x : startPointRef.current.x,
        y: height < 0 ? worldPos.y : startPointRef.current.y,
      });
    }
  };

  // Pointer Up handler: commit transient element or marquee selection
  const handlePointerUp = () => {
    isPointerDown.current = false;
    if (stageRef.current) {
      stageRef.current.container().style.cursor = isSpacePanning.current ? 'grab' : getCursorForTool(tool);
    }

    // Commit marquee selection
    if (tool === 'select' && marquee) {
      const normX = marquee.width < 0 ? marquee.x + marquee.width : marquee.x;
      const normY = marquee.height < 0 ? marquee.y + marquee.height : marquee.y;
      const normW = Math.abs(marquee.width);
      const normH = Math.abs(marquee.height);

      if (normW > 5 || normH > 5) {
        const intersectedIds = activePage.elements
          .filter(el => {
            const w = (el as any).width || 40;
            const h = (el as any).height || 40;
            return (
              el.x < normX + normW &&
              el.x + w > normX &&
              el.y < normY + normH &&
              el.y + h > normY
            );
          })
          .map(el => el.id);

        setSelectedElementIds(intersectedIds);
      }
      setMarquee(null);
      return;
    }

    // Commit transient drawn stroke or shape to project document model
    if (transientElement) {
      // Validate that stroke has at least 4 coordinates or shape has dimension
      if (
        (transientElement.type === 'pen' || transientElement.type === 'highlighter') &&
        (transientElement as StrokeElement).points.length >= 4
      ) {
        addElement(transientElement);
      } else if (transientElement.type === 'shape') {
        const s = transientElement as ShapeElement;
        if (s.width > 3 && s.height > 3) {
          addElement(s);
          setSelectedElementIds([s.id]);
        }
      }
      setTransientElement(null);
    }
  };

  // Double click to edit Text or Sticky Note
  const handleElementDoubleClick = (el: CanvasElement) => {
    if (el.type === 'text') {
      const textEl = el as TextElement;
      setEditingText({
        id: textEl.id,
        type: 'text',
        x: textEl.x,
        y: textEl.y,
        width: textEl.width || 200,
        height: 40,
        text: textEl.text,
        fontSize: textEl.fontSize,
        fontFamily: textEl.fontFamily,
        fontColor: textEl.fontColor,
      });
    } else if (el.type === 'sticky') {
      const stickyEl = el as StickyElement;
      setEditingText({
        id: stickyEl.id,
        type: 'sticky',
        x: stickyEl.x,
        y: stickyEl.y,
        width: stickyEl.width,
        height: stickyEl.height,
        text: stickyEl.text,
        fontSize: 16,
        fontFamily: 'Inter',
        fontColor: '#1e293b',
      });
    }
  };

  // Save inline text edits
  const handleSaveInlineText = () => {
    if (!editingText) return;
    if (editingText.type === 'text') {
      updateElement(editingText.id, { text: editingText.text });
    } else if (editingText.type === 'sticky') {
      updateElement(editingText.id, { text: editingText.text });
    }
    setEditingText(null);
  };

  // Drag-and-drop file upload directly onto canvas
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.container().getBoundingClientRect();
      const worldX = (e.clientX - rect.left - stagePos.x) / scale;
      const worldY = (e.clientY - rect.top - stagePos.y) / scale;

      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const maxWidth = 400;
        const aspect = img.width / img.height;
        const width = Math.min(img.width, maxWidth);
        const height = width / aspect;

        const newImage: ImageElement = {
          id: 'image_' + Math.random().toString(36).substring(2, 9),
          type: 'image',
          src: dataUrl,
          x: worldX,
          y: worldY,
          width,
          height,
          naturalWidth: img.width,
          naturalHeight: img.height,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        addElement(newImage);
        setSelectedElementIds([newImage.id]);
      };
    };
    reader.readAsDataURL(file);
  }, [scale, stagePos, stageRef, addElement, setSelectedElementIds]);

  // Render a specific shape element
  const renderShapeElement = (shape: ShapeElement) => {
    const strokeProps = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      fill: shape.fill && shape.fill !== 'transparent' ? shape.fill : undefined,
      opacity: shape.opacity !== undefined ? shape.opacity : 1,
      rotation: shape.rotation || 0,
      draggable: tool === 'select',
      onClick: (e: any) => {
        if (tool === 'select') {
          e.cancelBubble = true;
          setSelectedElementIds([shape.id]);
        }
      },
      onDragEnd: (e: any) => {
        updateElement(shape.id, { x: e.target.x(), y: e.target.y() });
      },
      onTransformEnd: (e: any) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        updateElement(shape.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
      },
    };

    switch (shape.shapeType) {
      case 'circle':
        return (
          <KonvaCircle
            {...strokeProps}
            key={shape.id}
            radius={Math.max(shape.width, shape.height) / 2}
            offsetX={-Math.max(shape.width, shape.height) / 2}
            offsetY={-Math.max(shape.width, shape.height) / 2}
          />
        );
      case 'ellipse':
        return (
          <KonvaEllipse
            {...strokeProps}
            key={shape.id}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            offsetX={-shape.width / 2}
            offsetY={-shape.height / 2}
          />
        );
      case 'arrow':
        return (
          <KonvaArrow
            key={shape.id}
            id={shape.id}
            points={[shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]}
            stroke={shape.stroke}
            fill={shape.stroke}
            strokeWidth={shape.strokeWidth}
            pointerLength={12}
            pointerWidth={10}
            draggable={tool === 'select'}
            onClick={(e) => {
              if (tool === 'select') {
                e.cancelBubble = true;
                setSelectedElementIds([shape.id]);
              }
            }}
          />
        );
      case 'line':
        return (
          <KonvaLine
            key={shape.id}
            id={shape.id}
            points={[shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            lineCap="round"
            draggable={tool === 'select'}
            onClick={(e) => {
              if (tool === 'select') {
                e.cancelBubble = true;
                setSelectedElementIds([shape.id]);
              }
            }}
          />
        );
      case 'star':
        return (
          <KonvaStar
            {...strokeProps}
            key={shape.id}
            numPoints={5}
            innerRadius={shape.width * 0.25}
            outerRadius={shape.width * 0.5}
            offsetX={-shape.width / 2}
            offsetY={-shape.height / 2}
          />
        );
      case 'rectangle':
      default:
        return (
          <KonvaRect
            {...strokeProps}
            key={shape.id}
            width={shape.width}
            height={shape.height}
            cornerRadius={4}
          />
        );
    }
  };

  const isLight = resolvedTheme === 'light';
  const defaultCanvasBg = isLight ? '#f8fafc' : '#090d16';
  const dotColor = isLight ? 'rgba(71, 85, 105, 0.28)' : 'rgba(255, 255, 255, 0.12)';
  const gridLineColor = isLight ? 'rgba(71, 85, 105, 0.15)' : 'rgba(255, 255, 255, 0.06)';
  const ruledLineColor = isLight ? 'rgba(71, 85, 105, 0.18)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative w-full h-full select-none overflow-hidden canvas-touch-safe touch-none"
      style={{
        backgroundColor: activePage.backgroundColor || defaultCanvasBg,
        backgroundImage: activePage.gridType === 'dots'
          ? `radial-gradient(circle, ${dotColor} 1.2px, transparent 1.2px)`
          : activePage.gridType === 'grid'
          ? `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`
          : activePage.gridType === 'ruled'
          ? `linear-gradient(to bottom, ${ruledLineColor} 1px, transparent 1px)`
          : 'none',
        backgroundSize: activePage.gridType === 'ruled'
          ? `100% ${32 * scale}px`
          : `${32 * scale}px ${32 * scale}px`,
        backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
      }}
    >
      <Stage
        ref={stageRef as any}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Layer 1: Elements */}
        <Layer>
          {/* Coordinate Plane Cartesian Axes when gridType is coordinate */}
          {activePage.gridType === 'coordinate' && (
            <KonvaGroup listening={false}>
              <KonvaLine
                points={[-10000, 0, 10000, 0]}
                stroke="#64748b"
                strokeWidth={2}
              />
              <KonvaLine
                points={[0, -10000, 0, 10000]}
                stroke="#64748b"
                strokeWidth={2}
              />
              <KonvaText
                x={12}
                y={-22}
                text="X"
                fill="#94a3b8"
                fontSize={14}
                fontStyle="bold"
                fontFamily="JetBrains Mono, monospace"
              />
              <KonvaText
                x={-22}
                y={12}
                text="Y"
                fill="#94a3b8"
                fontSize={14}
                fontStyle="bold"
                fontFamily="JetBrains Mono, monospace"
              />
              <KonvaText
                x={-16}
                y={-18}
                text="(0,0)"
                fill="#64748b"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              />
            </KonvaGroup>
          )}

          {activePage.elements.map((el) => {
            if (el.type === 'pen' || el.type === 'highlighter') {
              const stroke = el as StrokeElement;
              return (
                <KonvaLine
                  key={stroke.id}
                  id={stroke.id}
                  points={stroke.points}
                  stroke={stroke.color}
                  strokeWidth={stroke.size}
                  tension={stroke.tension || 0.4}
                  lineCap={stroke.lineCap || 'round'}
                  lineJoin={stroke.lineJoin || 'round'}
                  opacity={stroke.opacity !== undefined ? stroke.opacity : 1}
                  globalCompositeOperation={
                    stroke.type === 'highlighter' ? 'source-over' : 'source-over'
                  }
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([stroke.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(stroke.id, { x: e.target.x(), y: e.target.y() });
                  }}
                />
              );
            }

            if (el.type === 'shape') {
              return renderShapeElement(el as ShapeElement);
            }

            if (el.type === 'text') {
              const textEl = el as TextElement;
              return (
                <KonvaText
                  key={textEl.id}
                  id={textEl.id}
                  x={textEl.x}
                  y={textEl.y}
                  text={textEl.text}
                  fontSize={textEl.fontSize}
                  fontFamily={textEl.fontFamily || 'Inter'}
                  fill={textEl.fontColor || '#ffffff'}
                  opacity={textEl.opacity !== undefined ? textEl.opacity : 1}
                  rotation={textEl.rotation || 0}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([textEl.id]);
                    }
                  }}
                  onDblClick={() => handleElementDoubleClick(textEl)}
                  onDblTap={() => handleElementDoubleClick(textEl)}
                  onDragEnd={(e) => {
                    updateElement(textEl.id, { x: e.target.x(), y: e.target.y() });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    updateElement(textEl.id, {
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      fontSize: Math.max(10, textEl.fontSize * node.scaleX()),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
              );
            }

            if (el.type === 'sticky') {
              const stickyEl = el as StickyElement;
              return (
                <KonvaGroup
                  key={stickyEl.id}
                  id={stickyEl.id}
                  x={stickyEl.x}
                  y={stickyEl.y}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([stickyEl.id]);
                    }
                  }}
                  onDblClick={() => handleElementDoubleClick(stickyEl)}
                  onDblTap={() => handleElementDoubleClick(stickyEl)}
                  onDragEnd={(e) => {
                    updateElement(stickyEl.id, { x: e.target.x(), y: e.target.y() });
                  }}
                >
                  <KonvaRect
                    width={stickyEl.width}
                    height={stickyEl.height}
                    fill={stickyEl.color}
                    cornerRadius={8}
                    shadowColor="rgba(0,0,0,0.4)"
                    shadowBlur={12}
                    shadowOffset={{ x: 2, y: 4 }}
                    shadowOpacity={0.6}
                  />
                  <KonvaText
                    x={12}
                    y={12}
                    width={stickyEl.width - 24}
                    height={stickyEl.height - 24}
                    text={stickyEl.text}
                    fontSize={15}
                    fontFamily="Inter, sans-serif"
                    fill="#1e293b"
                    lineHeight={1.3}
                  />
                </KonvaGroup>
              );
            }

            if (el.type === 'image') {
              return (
                <CanvasImageItem
                  key={el.id}
                  element={el as ImageElement}
                  isSelected={selectedElementIds.includes(el.id)}
                  onSelect={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([el.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(20, (el as ImageElement).width * scaleX),
                      height: Math.max(20, (el as ImageElement).height * scaleY),
                      rotation: node.rotation(),
                    });
                  }}
                />
              );
            }

            if (el.type === 'formula') {
              const formula = el as FormulaElement;
              return (
                <KonvaGroup
                  key={formula.id}
                  id={formula.id}
                  x={formula.x}
                  y={formula.y}
                  draggable={tool === 'select'}
                  onClick={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([formula.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(formula.id, { x: e.target.x(), y: e.target.y() });
                  }}
                >
                  <KonvaRect
                    width={220}
                    height={54}
                    fill="#131722"
                    stroke="#a3e635"
                    strokeWidth={1}
                    cornerRadius={8}
                    opacity={0.9}
                  />
                  <KonvaText
                    x={12}
                    y={16}
                    text={formula.renderedText || formula.latex}
                    fontSize={formula.fontSize || 18}
                    fontFamily="JetBrains Mono, monospace"
                    fill={formula.color || '#a3e635'}
                  />
                </KonvaGroup>
              );
            }

            if (el.type === 'graph') {
              return (
                <CanvasGraphItem
                  key={el.id}
                  element={el as GraphElement}
                  tool={tool}
                  onSelect={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([el.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  }}
                />
              );
            }

            if (el.type === 'table') {
              return (
                <CanvasTableItem
                  key={el.id}
                  element={el as TableElement}
                  tool={tool}
                  onSelect={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([el.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  }}
                />
              );
            }

            if (el.type === 'flowchart') {
              return (
                <CanvasFlowchartItem
                  key={el.id}
                  element={el as FlowchartNodeElement}
                  tool={tool}
                  onSelect={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([el.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  }}
                />
              );
            }

            if (el.type === 'mindmap') {
              return (
                <CanvasMindmapItem
                  key={el.id}
                  element={el as MindmapNodeElement}
                  tool={tool}
                  onSelect={(e) => {
                    if (tool === 'select') {
                      e.cancelBubble = true;
                      setSelectedElementIds([el.id]);
                    }
                  }}
                  onDragEnd={(e) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  }}
                />
              );
            }

            return null;
          })}

          {/* Transient in-progress drawn stroke/shape */}
          {transientElement && transientElement.type === 'pen' && (
            <KonvaLine
              points={(transientElement as StrokeElement).points}
              stroke={(transientElement as StrokeElement).color}
              strokeWidth={(transientElement as StrokeElement).size}
              tension={0.45}
              lineCap="round"
              lineJoin="round"
              opacity={(transientElement as StrokeElement).opacity}
            />
          )}

          {transientElement && transientElement.type === 'highlighter' && (
            <KonvaLine
              points={(transientElement as StrokeElement).points}
              stroke={(transientElement as StrokeElement).color}
              strokeWidth={(transientElement as StrokeElement).size}
              tension={0.45}
              lineCap="square"
              lineJoin="round"
              opacity={0.35}
            />
          )}

          {transientElement && transientElement.type === 'shape' && (
            renderShapeElement(transientElement as ShapeElement)
          )}

          {/* Marquee Selection Rectangle */}
          {marquee && (
            <KonvaRect
              x={marquee.width < 0 ? marquee.x + marquee.width : marquee.x}
              y={marquee.height < 0 ? marquee.y + marquee.height : marquee.y}
              width={Math.abs(marquee.width)}
              height={Math.abs(marquee.height)}
              fill="rgba(163, 230, 53, 0.08)"
              stroke="#a3e635"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
            />
          )}

          {/* Konva Transformer Handles for selected element(s) */}
          <Transformer
            ref={transformerRef as any}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            anchorFill="#a3e635"
            anchorStroke="#090b0e"
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#a3e635"
            borderDash={[4, 4]}
          />
        </Layer>

        {/* Layer 2: Vanishing Laser Pointer */}
        {laserTrail.length > 1 && (
          <Layer listening={false}>
            {laserTrail.map((p, idx) => (
              <KonvaCircle
                key={p.id + '-' + idx}
                x={p.x}
                y={p.y}
                radius={Math.max(2, 6 * (idx / laserTrail.length))}
                fill="#ef4444"
                shadowColor="#ef4444"
                shadowBlur={10}
                opacity={idx / laserTrail.length}
              />
            ))}
          </Layer>
        )}
      </Stage>

      {/* HTML Overlay for In-Place Inline Text Editing */}
      {editingText && (
        <div
          className="absolute z-40"
          style={{
            left: `${editingText.x * scale + stagePos.x}px`,
            top: `${editingText.y * scale + stagePos.y}px`,
          }}
        >
          <textarea
            autoFocus
            defaultValue={editingText.text}
            onChange={(e) => setEditingText(prev => prev ? { ...prev, text: e.target.value } : null)}
            onBlur={handleSaveInlineText}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || editingText.type === 'text')) {
                handleSaveInlineText();
              } else if (e.key === 'Escape') {
                setEditingText(null);
              }
            }}
            className={`rounded-lg p-2 resize-none border shadow-2xl focus:outline-none ${
              editingText.type === 'sticky'
                ? 'bg-amber-100 text-slate-900 border-amber-300 font-sans'
                : 'bg-slate-900/90 text-white border-lime-500 font-sans'
            }`}
            style={{
              width: `${Math.max(160, editingText.width * scale)}px`,
              minHeight: `${Math.max(50, editingText.height * scale)}px`,
              fontSize: `${Math.max(14, editingText.fontSize * scale)}px`,
              fontFamily: editingText.fontFamily,
            }}
          />
        </div>
      )}
    </div>
  );
};
