import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { ShapeType } from '@/types/whiteboard';
import { 
  MousePointer, 
  Hand, 
  PenTool, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  Triangle, 
  Star, 
  ArrowRight, 
  Minus, 
  Type, 
  StickyNote, 
  Sigma, 
  Flame,
  ChevronRight,
  Disc,
  Activity,
  Table as TableIcon,
  Workflow,
  Network,
  FileUp,
  LayoutTemplate,
  Crop,
  Sparkles
} from 'lucide-react';

export interface WhiteboardToolbarProps {
  onOpenFormulaModal: () => void;
  onOpenGraphModal: () => void;
  onOpenTableModal: () => void;
  onOpenFlowchartModal: () => void;
  onOpenMindmapModal: () => void;
  onOpenPdfImportModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenImageCropModal: () => void;
  onOpenAiAssistant?: () => void;
  isAiAssistantOpen?: boolean;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  onOpenFormulaModal,
  onOpenGraphModal,
  onOpenTableModal,
  onOpenFlowchartModal,
  onOpenMindmapModal,
  onOpenPdfImportModal,
  onOpenTemplatesModal,
  onOpenImageCropModal,
  onOpenAiAssistant,
  isAiAssistantOpen,
}) => {
  const { 
    tool, 
    setTool, 
    shapeType, 
    setShapeType, 
    isFocusMode,
    addElement,
    scale,
    stagePos,
  } = useWhiteboard();

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const shapes: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
    { type: 'circle', label: 'Circle', icon: <Circle className="h-4 w-4" /> },
    { type: 'ellipse', label: 'Ellipse', icon: <Disc className="h-4 w-4" /> },
    { type: 'line', label: 'Line', icon: <Minus className="h-4 w-4" /> },
    { type: 'arrow', label: 'Arrow', icon: <ArrowRight className="h-4 w-4" /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle className="h-4 w-4" /> },
    { type: 'star', label: 'Star', icon: <Star className="h-4 w-4" /> },
  ];

  const handleSelectShape = (type: ShapeType) => {
    setShapeType(type);
    setTool('shape');
    setShapeMenuOpen(false);
  };

  const getShapeIcon = () => {
    const found = shapes.find(s => s.type === shapeType);
    return found ? found.icon : <Square className="h-4 w-4" />;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const maxWidth = 350;
        const aspect = img.width / img.height;
        const width = Math.min(img.width, maxWidth);
        const height = width / aspect;

        // Place image in center of current viewport
        const centerX = (window.innerWidth / 2 - stagePos.x) / scale - width / 2;
        const centerY = (window.innerHeight / 2 - stagePos.y) / scale - height / 2;

        addElement({
          id: 'image_' + Math.random().toString(36).substring(2, 9),
          type: 'image',
          src: dataUrl,
          x: Math.max(20, centerX),
          y: Math.max(20, centerY),
          width,
          height,
          naturalWidth: img.width,
          naturalHeight: img.height,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setTool('select');
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // In Focus mode, hide the left palette
  if (isFocusMode) {
    return null;
  }

  return (
    <div className="fixed left-3 sm:left-4 top-16 sm:top-20 z-40 select-none">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 p-1.5 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden"
      >
        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* 1. Select Tool */}
        <button
          onClick={() => {
            setTool('select');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'select'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Select & Transform (V)"
          aria-label="Select & Transform (V)"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        {/* 2. Hand / Pan Tool */}
        <button
          onClick={() => {
            setTool('pan');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'pan'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Pan / Hand Tool (H or Space+Drag)"
          aria-label="Pan / Hand Tool (H or Space+Drag)"
        >
          <Hand className="h-4 w-4" />
        </button>

        <div className="h-[1px] w-6 bg-slate-800 my-0.5" />

        {/* 3. Pen */}
        <button
          onClick={() => {
            setTool('pen');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'pen'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Pen / Freehand (P)"
          aria-label="Pen / Freehand (P)"
        >
          <PenTool className="h-4 w-4" />
        </button>

        {/* 4. Highlighter */}
        <button
          onClick={() => {
            setTool('highlighter');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'highlighter'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Highlighter (B)"
          aria-label="Highlighter (B)"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        {/* 5. Eraser */}
        <button
          onClick={() => {
            setTool('eraser');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'eraser'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Eraser (E)"
          aria-label="Eraser (E)"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="h-[1px] w-6 bg-slate-800 my-0.5" />

        {/* 6. Shape Menu with Flyout */}
        <div className="relative">
          <button
            onClick={() => {
              if (tool === 'shape') {
                setShapeMenuOpen(!shapeMenuOpen);
              } else {
                setTool('shape');
                setShapeMenuOpen(true);
              }
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all relative ${
              tool === 'shape'
                ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Geometric Shapes (S)"
            aria-label="Geometric Shapes (S)"
          >
            {getShapeIcon()}
            <ChevronRight className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 opacity-70" />
          </button>

          <AnimatePresence>
            {shapeMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-12 top-0 z-50 flex flex-col gap-1 rounded-xl border border-slate-800 bg-[#0f141d] p-1.5 shadow-2xl backdrop-blur-xl min-w-[130px]"
              >
                {shapes.map((s) => (
                  <button
                    key={s.type}
                    onClick={() => handleSelectShape(s.type)}
                    aria-label={`Shape: ${s.label}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      shapeType === s.type && tool === 'shape'
                        ? 'bg-lime-500/20 text-lime-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. Text Tool */}
        <button
          onClick={() => {
            setTool('text');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'text'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Text Note (T)"
          aria-label="Text Note (T)"
        >
          <Type className="h-4 w-4" />
        </button>

        {/* 8. Sticky Note */}
        <button
          onClick={() => {
            setTool('sticky');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'sticky'
              ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Sticky Note (N)"
          aria-label="Sticky Note (N)"
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* 9. Image Upload & Crop */}
        <div className="relative group">
          <button
            onClick={onOpenImageCropModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-lime-300 transition-all"
            title="Image Upload & Aspect Ratio Framing"
            aria-label="Image Upload & Aspect Ratio Framing"
          >
            <Crop className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[1px] w-6 bg-slate-800 my-0.5" />

        {/* Educational Tools Section */}
        {/* 10. Math Formula / LaTeX */}
        <button
          onClick={onOpenFormulaModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-lime-400 transition-all"
          title="Math Formula & LaTeX (M)"
          aria-label="Math Formula & LaTeX (M)"
        >
          <Sigma className="h-4 w-4" />
        </button>

        {/* 11. Function Graph Plotter */}
        <button
          onClick={onOpenGraphModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-sky-400 transition-all"
          title="2D Function Graph Plotter (G)"
          aria-label="2D Function Graph Plotter (G)"
        >
          <Activity className="h-4 w-4" />
        </button>

        {/* 12. Flowchart Builder */}
        <button
          onClick={onOpenFlowchartModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-all"
          title="Flowchart & Logic Nodes"
          aria-label="Flowchart & Logic Nodes"
        >
          <Workflow className="h-4 w-4" />
        </button>

        {/* 13. Mind Map Creator */}
        <button
          onClick={onOpenMindmapModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all"
          title="Mind Map & Concept Tree"
          aria-label="Mind Map & Concept Tree"
        >
          <Network className="h-4 w-4" />
        </button>

        {/* 14. Lecture Notes & Comparison Table */}
        <button
          onClick={onOpenTableModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-purple-400 transition-all"
          title="Comparison & Lecture Table"
          aria-label="Comparison & Lecture Table"
        >
          <TableIcon className="h-4 w-4" />
        </button>

        <div className="h-[1px] w-6 bg-slate-800 my-0.5" />

        {/* 15. PDF Import for Slide Annotation */}
        <button
          onClick={onOpenPdfImportModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all"
          title="Import PDF Slides & Exam Papers"
          aria-label="Import PDF Slides & Exam Papers"
        >
          <FileUp className="h-4 w-4" />
        </button>

        {/* 16. Subject Templates */}
        <button
          onClick={onOpenTemplatesModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-lime-400 transition-all"
          title="Educational Starter Templates"
          aria-label="Educational Starter Templates"
        >
          <LayoutTemplate className="h-4 w-4" />
        </button>

        {/* 17. AI Learning Assistant */}
        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
              isAiAssistantOpen
                ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/25 ring-1 ring-lime-400'
                : 'text-lime-400 hover:bg-lime-500/10 hover:text-lime-300'
            }`}
            title="AI Learning Assistant (Explain, Notes, Quiz, Diagrams)"
            aria-label="AI Learning Assistant (Explain, Notes, Quiz, Diagrams)"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}

        <div className="h-[1px] w-6 bg-slate-800 my-0.5" />

        {/* 18. Laser Pointer */}
        <button
          onClick={() => {
            setTool('laser');
            setShapeMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            tool === 'laser'
              ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-red-400'
          }`}
          title="Laser Pointer (L)"
          aria-label="Laser Pointer (L)"
        >
          <Flame className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};
