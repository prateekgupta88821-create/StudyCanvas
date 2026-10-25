import React from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  HelpCircle,
  Hand
} from 'lucide-react';

export interface WhiteboardBottomBarProps {
  onOpenShortcuts: () => void;
}

export const WhiteboardBottomBar: React.FC<WhiteboardBottomBarProps> = ({ onOpenShortcuts }) => {
  const {
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    project,
    activePageIndex,
    switchPage,
    addPage,
    tool,
    setTool,
    isFocusMode,
  } = useWhiteboard();

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      switchPage(activePageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (activePageIndex < project.pages.length - 1) {
      switchPage(activePageIndex + 1);
    }
  };

  // In focus mode, render a minimal floating trigger or hide
  if (isFocusMode) {
    return (
      <div className="fixed bottom-3 right-3 z-40">
        <button
          onClick={onOpenShortcuts}
          className="h-8 w-8 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none flex items-center gap-2 max-w-[95vw] overflow-x-auto no-scrollbar">
      {/* 1. Zoom and Viewport Navigation Controls */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
        {/* Toggle Hand / Pan */}
        <button
          onClick={() => setTool(tool === 'pan' ? 'select' : 'pan')}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
            tool === 'pan'
              ? 'bg-lime-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
          title="Hand / Pan tool (H or Space+Drag)"
          aria-label="Hand / Pan tool (H or Space+Drag)"
        >
          <Hand className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom Out (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        {/* Zoom Reset / Current Zoom percentage */}
        <button
          onClick={resetZoom}
          className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-lime-400 transition-colors min-w-[50px] text-center"
          title="Reset Zoom to 100% (0)"
          aria-label={`Current Zoom ${Math.round(scale * 100)} percent. Click to reset to 100 percent`}
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In */}
        <button
          onClick={zoomIn}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom In (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        {/* Zoom to Fit */}
        <button
          onClick={() => zoomToFit()}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors"
          title="Zoom to Fit Canvas"
          aria-label="Zoom to Fit Canvas"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. Page Management Controls */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
        <button
          onClick={handlePrevPage}
          disabled={activePageIndex === 0}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-xs font-semibold text-slate-200 min-w-[70px] text-center">
          {activePageIndex + 1} / {project.pages.length}
        </span>

        <button
          onClick={handleNextPage}
          disabled={activePageIndex >= project.pages.length - 1}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        <button
          onClick={() => addPage()}
          className="h-7 px-2 rounded-lg text-xs font-medium text-lime-400 hover:bg-lime-500/10 flex items-center gap-1 transition-colors"
          title="Add New Slide / Page"
          aria-label="Add New Slide / Page"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Page</span>
        </button>
      </div>

      {/* 3. Keyboard Shortcuts modal trigger */}
      <div className="flex items-center rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 p-1.5 shadow-2xl backdrop-blur-xl">
        <button
          onClick={onOpenShortcuts}
          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
