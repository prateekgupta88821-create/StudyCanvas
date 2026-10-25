import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Flame 
} from 'lucide-react';

export const PresentationMode: React.FC = () => {
  const {
    isPresentationMode,
    setIsPresentationMode,
    project,
    activePageIndex,
    switchPage,
    tool,
    setTool,
  } = useWhiteboard();

  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
        setIsPresentationMode(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (activePageIndex < project.pages.length - 1) {
          switchPage(activePageIndex + 1);
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (activePageIndex > 0) {
          switchPage(activePageIndex - 1);
        }
      }

      if (e.key.toLowerCase() === 'l') {
        setTool(tool === 'laser' ? 'select' : 'laser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, activePageIndex, project.pages.length, switchPage, setIsPresentationMode, tool, setTool]);

  if (!isPresentationMode) return null;

  const handlePrev = () => {
    if (activePageIndex > 0) switchPage(activePageIndex - 1);
  };

  const handleNext = () => {
    if (activePageIndex < project.pages.length - 1) switchPage(activePageIndex + 1);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top minimal status indicator */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="self-center pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-2xl"
      >
        <span className="text-xs font-semibold text-slate-200 truncate max-w-xs">
          {project.title}
        </span>
        <span className="text-[11px] font-mono text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-500/20">
          Slide {activePageIndex + 1} of {project.pages.length}
        </span>
      </motion.div>

      {/* Bottom floating presenter controls */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="self-center pointer-events-auto flex items-center gap-2 bg-[#0c1017]/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2 shadow-2xl"
      >
        <button
          onClick={handlePrev}
          disabled={activePageIndex === 0}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
          title="Previous Slide (Left Arrow / PageUp)"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="px-3 text-xs font-semibold text-slate-200 font-mono">
          {activePageIndex + 1} / {project.pages.length}
        </span>

        <button
          onClick={handleNext}
          disabled={activePageIndex >= project.pages.length - 1}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
          title="Next Slide (Right Arrow / PageDown / Space)"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Laser tool toggle */}
        <button
          onClick={() => setTool(tool === 'laser' ? 'select' : 'laser')}
          className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            tool === 'laser'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Laser Pointer (L)"
        >
          <Flame className="h-4 w-4" />
          <span>Laser</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Exit presentation */}
        <button
          onClick={() => setIsPresentationMode(false)}
          className="h-9 px-3 rounded-xl flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Exit Presentation Mode (Esc)"
        >
          <X className="h-4 w-4" />
          <span>Exit</span>
        </button>
      </motion.div>
    </div>
  );
};
