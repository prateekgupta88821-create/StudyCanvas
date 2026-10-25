import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';

export const WhiteboardToolbar: React.FC<{ onOpenFormulaModal: () => void }> = ({
  onOpenFormulaModal,
}) => {
  const { tool, setTool, shapeType, setShapeType } = useWhiteboard();
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

  const shapes: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
    { type: 'circle', label: 'Circle', icon: <Circle className="h-4 w-4" /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle className="h-4 w-4" /> },
    { type: 'star', label: 'Star', icon: <Star className="h-4 w-4" /> },
    { type: 'arrow', label: 'Arrow', icon: <ArrowRight className="h-4 w-4" /> },
    { type: 'line', label: 'Line', icon: <Minus className="h-4 w-4" /> },
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="flex items-center gap-1 rounded-2xl border border-slate-800/90 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        {/* Select Tool */}
        <button
          onClick={() => setTool('select')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'select'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Select & Move (V)"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        {/* Pan Hand Tool */}
        <button
          onClick={() => setTool('pan')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'pan'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Pan / Hand Tool"
        >
          <Hand className="h-4 w-4" />
        </button>

        <div className="h-6 w-[1px] bg-slate-800 mx-0.5" />

        {/* Freehand Pen */}
        <button
          onClick={() => setTool('pen')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'pen'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Pen / Pencil (P)"
        >
          <PenTool className="h-4 w-4" />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setTool('highlighter')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Highlighter (H)"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => setTool('eraser')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'eraser'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Eraser (E)"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="h-6 w-[1px] bg-slate-800 mx-0.5" />

        {/* Shapes Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (tool === 'shape') {
                setShapeMenuOpen(prev => !prev);
              } else {
                setTool('shape');
              }
            }}
            className={`flex h-10 items-center gap-1 px-2.5 rounded-xl transition-all ${
              tool === 'shape'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Geometric Shapes (R)"
          >
            {getShapeIcon()}
            <ChevronUp className="h-3 w-3 opacity-70" />
          </button>

          <AnimatePresence>
            {shapeMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShapeMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-0 mb-2 w-44 rounded-2xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 grid grid-cols-2 gap-1"
                >
                  {shapes.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => handleSelectShape(s.type)}
                      className={`flex items-center gap-2 rounded-xl p-2 text-xs font-medium transition-colors ${
                        shapeType === s.type
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Text Annotation */}
        <button
          onClick={() => setTool('text')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'text'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Text Label / Notes (T)"
        >
          <Type className="h-4 w-4" />
        </button>

        {/* Sticky Notes */}
        <button
          onClick={() => setTool('sticky')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'sticky'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-amber-300'
          }`}
          title="Sticky Note (S)"
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* Educational Math Formula / Equation */}
        <button
          onClick={() => {
            setTool('formula');
            onOpenFormulaModal();
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'formula'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-purple-300'
          }`}
          title="Math Formula & Science Stamps (M)"
        >
          <Sigma className="h-4 w-4" />
        </button>

        {/* Laser Pointer */}
        <button
          onClick={() => setTool('laser')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            tool === 'laser'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-rose-400'
          }`}
          title="Laser Pointer for Lectures (L)"
        >
          <Flame className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};
