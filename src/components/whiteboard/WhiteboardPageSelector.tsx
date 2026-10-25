import React from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Layers, Check } from 'lucide-react';

export const WhiteboardPageSelector: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { project, activePageIndex, switchPage, addPage, deletePage } = useWhiteboard();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Lecture Slides & Pages"
      description="Manage multi-slide whiteboard lectures. Add new blank slides or switch between topics."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {project.pages.length} {project.pages.length === 1 ? 'Slide' : 'Slides'} in this whiteboard session
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              addPage();
            }}
            className="text-xs h-8"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add New Slide
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {project.pages.map((page, index) => {
            const isActive = index === activePageIndex;
            const elementCount = page.elements?.length || 0;

            return (
              <div
                key={page.id}
                onClick={() => {
                  switchPage(index);
                  onClose();
                }}
                className={`group relative flex flex-col justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50 shadow-lg'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Thumbnail representation */}
                <div className="h-20 w-full rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-2 overflow-hidden relative">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Layers className="h-5 w-5 mb-1 opacity-50" />
                    <span className="text-[10px]">{elementCount} elements</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 bg-indigo-600 rounded-full p-1 text-white shadow-sm">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Slide {index + 1}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{page.gridType || 'dots'} grid</p>
                  </div>

                  {project.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete Slide ${index + 1}?`)) {
                          deletePage(index);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
