import React, { useState } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Edit2, 
  Check, 
  Layers,
  Sparkles 
} from 'lucide-react';

export const WhiteboardPageSelector: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { 
    project, 
    activePageIndex, 
    switchPage, 
    addPage, 
    duplicatePage, 
    renamePage, 
    reorderPages, 
    deletePage 
  } = useWhiteboard();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (index: number, currentTitle: string) => {
    setEditingIndex(index);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (index: number) => {
    if (editingTitle.trim()) {
      renamePage(index, editingTitle.trim());
    }
    setEditingIndex(null);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Slide Manager & Multi-Page Lecture"
      description="Organize your slides, reorder topics, duplicate templates, and rename slides."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              {project.pages.length} {project.pages.length === 1 ? 'Slide' : 'Slides'} in lecture
            </span>
            <span className="text-[11px] text-lime-400 font-semibold bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-500/20">
              Active: Slide {activePageIndex + 1}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => addPage()}
            className="text-xs h-8 bg-lime-500 text-slate-950 font-semibold hover:bg-lime-400 shadow-none"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add New Slide
          </Button>
        </div>

        {/* Slides Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {project.pages.map((page, index) => {
            const isActive = index === activePageIndex;
            const elementCount = page.elements?.length || 0;
            const isEditing = editingIndex === index;

            return (
              <div
                key={page.id}
                onClick={() => {
                  switchPage(index);
                  onClose();
                }}
                className={`group relative flex flex-col justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-lime-400/80 bg-lime-500/10 ring-2 ring-lime-400/40 shadow-xl'
                    : 'border-slate-800 bg-[#0c1017] hover:border-slate-700 hover:bg-[#12161f]'
                }`}
              >
                {/* Visual Thumbnail Representation */}
                <div 
                  className="h-28 w-full rounded-xl border border-slate-800 flex items-center justify-center mb-2.5 overflow-hidden relative shadow-inner"
                  style={{
                    backgroundColor: page.backgroundColor || '#090d16',
                    backgroundImage: page.gridType === 'dots'
                      ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
                      : page.gridType === 'grid' || page.gridType === 'coordinate'
                      ? 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)'
                      : page.gridType === 'ruled'
                      ? 'linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)'
                      : 'none',
                    backgroundSize: '16px 16px',
                  }}
                >
                  {/* Miniature element indicators */}
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Layers className="h-5 w-5 mb-1 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">
                      {elementCount} {elementCount === 1 ? 'element' : 'elements'}
                    </span>
                  </div>

                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-lime-500 rounded-full p-1 text-slate-950 shadow-md">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Slide number pill */}
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                    #{index + 1}
                  </div>
                </div>

                {/* Footer Controls: Title, Rename, Duplicate, Move, Delete */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(index)}
                          autoFocus
                          className="bg-slate-900 border border-lime-400 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(index)}
                          className="p-1 text-lime-400 hover:bg-slate-800 rounded"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {page.title || `Slide ${index + 1}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(index, page.title || `Slide ${index + 1}`);
                          }}
                          className="p-0.5 text-slate-500 hover:text-lime-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename slide"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span className="capitalize">{page.gridType || 'dots'}</span>

                    {/* Actions row */}
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {/* Move left/up */}
                      <button
                        disabled={index === 0}
                        onClick={() => reorderPages(index, index - 1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded transition-colors"
                        title="Move slide left"
                      >
                        <ChevronUp className="h-3.5 w-3.5 -rotate-90" />
                      </button>

                      {/* Move right/down */}
                      <button
                        disabled={index === project.pages.length - 1}
                        onClick={() => reorderPages(index, index + 1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded transition-colors"
                        title="Move slide right"
                      >
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => duplicatePage(index)}
                        className="p-1 text-slate-400 hover:text-lime-300 hover:bg-slate-800 rounded transition-colors"
                        title="Duplicate slide"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      {project.pages.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete Slide ${index + 1} (${page.title || 'Untitled'})?`)) {
                              deletePage(index);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete slide"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-lime-400" />
            <span>Click any slide to switch canvas view instantly.</span>
          </p>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
