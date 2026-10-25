import React, { useRef, useState, useEffect } from 'react';
import { 
  Stage, 
  Layer, 
  Line, 
  Rect, 
  Circle, 
  Text, 
  Star, 
  Arrow, 
  Group, 
  Transformer 
} from 'react-konva';
import type Konva from 'konva';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { 
  CanvasElement, 
  StrokeElement, 
  ShapeElement, 
  TextElement, 
  StickyElement, 
  FormulaElement,
  Point 
} from '@/types/whiteboard';

export interface WhiteboardStageProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const WhiteboardStage: React.FC<WhiteboardStageProps> = ({ stageRef }) => {
  const {
    activePage,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    gridType,
    scale,
    setScale,
    stagePos,
    setStagePos,
    addElement,
    updateElement,
    deleteElement,
    selectedElementId,
    setSelectedElementId,
  } = useWhiteboard();

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 56, // subtract navbar height
  });

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const isDrawing = useRef(false);
  const currentElementRef = useRef<CanvasElement | null>(null);
  const startPointRef = useRef<Point>({ x: 0, y: 0 });

  // Laser pointer vanishing trail
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  // Update canvas dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 56,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Konva transformer node when selectedElementId changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedElementId && tool === 'select') {
      const selectedNode = stageRef.current.findOne('#' + selectedElementId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedElementId, tool, stageRef]);

  // Handle stage pointer down
  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Deselect if clicked on empty stage
    if (e.target === stage) {
      setSelectedElementId(null);
    }

    if (tool === 'pan') {
      return; // Handled by Stage draggable
    }

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Transform raw screen position to canvas coordinates taking zoom and pan into account
    const canvasX = (pointerPos.x - stagePos.x) / scale;
    const canvasY = (pointerPos.y - stagePos.y) / scale;

    startPointRef.current = { x: canvasX, y: canvasY };
    isDrawing.current = true;

    if (tool === 'pen' || tool === 'highlighter') {
      const newStroke: StrokeElement = {
        id: 'stroke_' + Math.random().toString(36).substring(2, 9),
        type: tool,
        x: 0,
        y: 0,
        points: [canvasX, canvasY],
        color: strokeColor,
        size: tool === 'highlighter' ? strokeWidth * 3.5 : strokeWidth,
        opacity: tool === 'highlighter' ? 0.35 : 1,
        tension: 0.5,
        lineCap: tool === 'highlighter' ? 'square' : 'round',
        lineJoin: 'round',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentElementRef.current = newStroke;
      addElement(newStroke);
    } else if (tool === 'shape') {
      const newShape: ShapeElement = {
        id: 'shape_' + Math.random().toString(36).substring(2, 9),
        type: 'shape',
        shapeType,
        x: canvasX,
        y: canvasY,
        width: 1,
        height: 1,
        stroke: strokeColor,
        strokeWidth,
        fill: shapeType === 'circle' || shapeType === 'rectangle' ? 'transparent' : strokeColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentElementRef.current = newShape;
      addElement(newShape);
    } else if (tool === 'text') {
      const textPrompt = prompt('Enter annotation text:', 'Key Lecture Takeaway');
      if (textPrompt && textPrompt.trim()) {
        const newText: TextElement = {
          id: 'text_' + Math.random().toString(36).substring(2, 9),
          type: 'text',
          x: canvasX,
          y: canvasY,
          text: textPrompt.trim(),
          fontSize: 20,
          fontFamily: 'Inter',
          fontColor: strokeColor,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addElement(newText);
      }
      isDrawing.current = false;
    } else if (tool === 'sticky') {
      const stickyPrompt = prompt('Sticky note content:', 'Recall: Study this theorem for quiz');
      if (stickyPrompt) {
        const newSticky: StickyElement = {
          id: 'sticky_' + Math.random().toString(36).substring(2, 9),
          type: 'sticky',
          x: canvasX,
          y: canvasY,
          text: stickyPrompt,
          color: '#fef08a', // classic warm educational sticky yellow
          width: 160,
          height: 140,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addElement(newSticky);
      }
      isDrawing.current = false;
    } else if (tool === 'laser') {
      setLaserTrail([{ x: canvasX, y: canvasY, id: Date.now() }]);
    }
  };

  // Handle stage pointer move
  const handlePointerMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const canvasX = (pointerPos.x - stagePos.x) / scale;
    const canvasY = (pointerPos.y - stagePos.y) / scale;

    // Laser pointer mode
    if (tool === 'laser') {
      const newPoint = { x: canvasX, y: canvasY, id: Date.now() };
      setLaserTrail(prev => [...prev.slice(-15), newPoint]);
      // Vanish trail gradually
      setTimeout(() => {
        setLaserTrail(prev => prev.filter(p => Date.now() - p.id < 450));
      }, 450);
      return;
    }

    if (!isDrawing.current) return;

    // Eraser mode: detect intersection and remove elements
    if (tool === 'eraser') {
      const threshold = 18 / scale;
      activePage.elements.forEach((el) => {
        if (el.type === 'pen' || el.type === 'highlighter') {
          const stroke = el as StrokeElement;
          for (let i = 0; i < stroke.points.length; i += 2) {
            const px = stroke.points[i];
            const py = stroke.points[i + 1];
            if (Math.hypot(px - canvasX, py - canvasY) < threshold) {
              deleteElement(el.id);
              break;
            }
          }
        } else if (el.type === 'shape' || el.type === 'text' || el.type === 'sticky' || el.type === 'formula') {
          if (
            canvasX >= el.x - 10 &&
            canvasX <= el.x + 120 &&
            canvasY >= el.y - 10 &&
            canvasY <= el.y + 100
          ) {
            deleteElement(el.id);
          }
        }
      });
      return;
    }

    // Active stroke drawing
    if ((tool === 'pen' || tool === 'highlighter') && currentElementRef.current) {
      const current = currentElementRef.current as StrokeElement;
      const updatedPoints = current.points.concat([canvasX, canvasY]);
      current.points = updatedPoints;
      updateElement(current.id, { points: updatedPoints });
    }

    // Active shape sizing
    if (tool === 'shape' && currentElementRef.current) {
      const current = currentElementRef.current as ShapeElement;
      const width = canvasX - startPointRef.current.x;
      const height = canvasY - startPointRef.current.y;
      updateElement(current.id, {
        width: Math.abs(width),
        height: Math.abs(height),
        x: width < 0 ? canvasX : startPointRef.current.x,
        y: height < 0 ? canvasY : startPointRef.current.y,
      });
    }
  };

  // Handle stage pointer up
  const handlePointerUp = () => {
    isDrawing.current = false;
    currentElementRef.current = null;
  };

  // Zoom on mouse wheel towards pointer
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(0.2, newScale), 4);

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Render element helper
  const renderElement = (el: CanvasElement) => {
    switch (el.type) {
      case 'pen':
      case 'highlighter': {
        const stroke = el as StrokeElement;
        return (
          <Line
            key={el.id}
            id={el.id}
            points={stroke.points}
            stroke={stroke.color}
            strokeWidth={stroke.size}
            opacity={stroke.opacity ?? 1}
            tension={stroke.tension ?? 0.5}
            lineCap={stroke.lineCap ?? 'round'}
            lineJoin="round"
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && setSelectedElementId(el.id)}
            onTap={() => tool === 'select' && setSelectedElementId(el.id)}
            onDragEnd={(e) => {
              updateElement(el.id, { x: e.target.x(), y: e.target.y() });
            }}
          />
        );
      }

      case 'shape': {
        const shape = el as ShapeElement;
        const commonProps = {
          key: el.id,
          id: el.id,
          x: shape.x,
          y: shape.y,
          stroke: shape.stroke,
          strokeWidth: shape.strokeWidth,
          draggable: tool === 'select',
          onClick: () => tool === 'select' && setSelectedElementId(el.id),
          onTap: () => tool === 'select' && setSelectedElementId(el.id),
          onDragEnd: (e: any) => {
            updateElement(el.id, { x: e.target.x(), y: e.target.y() });
          },
          onTransformEnd: (e: any) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            updateElement(el.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(10, node.width() * scaleX),
              height: Math.max(10, node.height() * scaleY),
              rotation: node.rotation(),
            });
          },
        };

        if (shape.shapeType === 'circle') {
          const radius = Math.max(shape.width, shape.height) / 2;
          return <Circle {...commonProps} radius={radius} fill={shape.fill || 'transparent'} />;
        }

        if (shape.shapeType === 'arrow') {
          return (
            <Arrow
              {...commonProps}
              points={[0, 0, shape.width || 80, shape.height || 0]}
              pointerLength={12}
              pointerWidth={10}
              fill={shape.stroke}
            />
          );
        }

        if (shape.shapeType === 'line') {
          return (
            <Line
              {...commonProps}
              points={[0, 0, shape.width || 100, shape.height || 0]}
              lineCap="round"
            />
          );
        }

        if (shape.shapeType === 'star') {
          return (
            <Star
              {...commonProps}
              numPoints={5}
              innerRadius={Math.min(shape.width, shape.height) / 4}
              outerRadius={Math.min(shape.width, shape.height) / 2}
              fill={shape.fill || 'transparent'}
            />
          );
        }

        // Default: Rectangle
        return (
          <Rect
            {...commonProps}
            width={shape.width || 60}
            height={shape.height || 60}
            cornerRadius={6}
            fill={shape.fill || 'transparent'}
          />
        );
      }

      case 'text': {
        const textEl = el as TextElement;
        return (
          <Text
            key={el.id}
            id={el.id}
            x={textEl.x}
            y={textEl.y}
            text={textEl.text}
            fontSize={textEl.fontSize || 20}
            fontFamily={textEl.fontFamily || 'Inter'}
            fill={textEl.fontColor || '#ffffff'}
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && setSelectedElementId(el.id)}
            onTap={() => tool === 'select' && setSelectedElementId(el.id)}
            onDblClick={() => {
              const updated = prompt('Edit annotation text:', textEl.text);
              if (updated !== null && updated.trim()) {
                updateElement(el.id, { text: updated.trim() });
              }
            }}
            onDragEnd={(e) => {
              updateElement(el.id, { x: e.target.x(), y: e.target.y() });
            }}
          />
        );
      }

      case 'sticky': {
        const sticky = el as StickyElement;
        return (
          <Group
            key={el.id}
            id={el.id}
            x={sticky.x}
            y={sticky.y}
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && setSelectedElementId(el.id)}
            onTap={() => tool === 'select' && setSelectedElementId(el.id)}
            onDragEnd={(e) => {
              updateElement(el.id, { x: e.target.x(), y: e.target.y() });
            }}
          >
            <Rect
              width={sticky.width || 160}
              height={sticky.height || 140}
              fill={sticky.color || '#fef08a'}
              cornerRadius={8}
              shadowColor="#000000"
              shadowBlur={12}
              shadowOpacity={0.3}
              shadowOffset={{ x: 3, y: 4 }}
            />
            <Text
              x={12}
              y={12}
              width={(sticky.width || 160) - 24}
              height={(sticky.height || 140) - 24}
              text={sticky.text}
              fontSize={14}
              fontFamily="Inter"
              fill="#1e293b"
              wrap="word"
              onDblClick={() => {
                const updated = prompt('Edit Sticky Note:', sticky.text);
                if (updated !== null) {
                  updateElement(el.id, { text: updated });
                }
              }}
            />
          </Group>
        );
      }

      case 'formula': {
        const formula = el as FormulaElement;
        return (
          <Group
            key={el.id}
            id={el.id}
            x={formula.x}
            y={formula.y}
            draggable={tool === 'select'}
            onClick={() => tool === 'select' && setSelectedElementId(el.id)}
            onTap={() => tool === 'select' && setSelectedElementId(el.id)}
            onDragEnd={(e) => {
              updateElement(el.id, { x: e.target.x(), y: e.target.y() });
            }}
          >
            <Rect
              width={Math.max(200, formula.renderedText.length * 11 + 30)}
              height={50}
              fill="#0f172a"
              stroke="#6366f1"
              strokeWidth={1.5}
              cornerRadius={10}
              shadowColor="#6366f1"
              shadowBlur={8}
              shadowOpacity={0.2}
            />
            <Text
              x={15}
              y={14}
              text={formula.renderedText}
              fontSize={formula.fontSize || 18}
              fontFamily="JetBrains Mono, monospace"
              fontStyle="bold"
              fill={formula.color || '#fbbf24'}
            />
          </Group>
        );
      }

      default:
        return null;
    }
  };

  const getGridClass = () => {
    switch (gridType) {
      case 'dots': return 'bg-grid-dots';
      case 'grid': return 'bg-grid-lines';
      case 'ruled': return 'bg-grid-ruled';
      case 'isometric': return 'bg-grid-isometric';
      default: return 'bg-slate-950';
    }
  };

  return (
    <div 
      className={`relative h-[calc(100vh-56px)] w-full overflow-hidden select-none ${getGridClass()}`}
      style={{ cursor: tool === 'pan' ? 'grab' : (tool === 'eraser' ? 'crosshair' : (tool === 'select' ? 'default' : 'crosshair')) }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={tool === 'pan'}
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onDragEnd={(e) => {
          if (tool === 'pan' && e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          {/* Active page elements */}
          {activePage.elements.map(renderElement)}

          {/* Laser pointer trail animation */}
          {laserTrail.length > 1 && (
            <Line
              points={laserTrail.flatMap(p => [p.x, p.y])}
              stroke="#f43f5e"
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
              shadowColor="#f43f5e"
              shadowBlur={18}
              shadowOpacity={0.9}
              opacity={0.85}
            />
          )}

          {/* Konva Transformer for resizing/rotating selected elements */}
          {tool === 'select' && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#6366f1"
              borderDash={[4, 4]}
              anchorFill="#6366f1"
              anchorStroke="#ffffff"
              anchorSize={8}
              anchorCornerRadius={4}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
