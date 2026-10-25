import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CanvasElement } from '@/types/whiteboard';
import { LayoutCoordinateUpdate } from '@/services/aiAssistantService';
import { Sparkles, ArrowRight, LayoutGrid, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface MagicOrganizeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElements: CanvasElement[];
  layoutUpdates: LayoutCoordinateUpdate[];
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const MagicOrganizeConfirmDialog: React.FC<MagicOrganizeConfirmDialogProps> = ({
  isOpen,
  onClose,
  selectedElements,
  layoutUpdates,
  onConfirm,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  if (!isOpen) return null;

  const count = selectedElements.length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Magic Organize Confirmation"
      description="StudyCanvas AI calculated a balanced, uniform layout for your selected whiteboard objects."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        {/* Banner with educational icon */}
        <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-lime-500/20 text-lime-400 shrink-0">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-white text-sm">Review Layout Reorganization</p>
            <p className="mt-1 text-slate-400">
              Aligns <span className="text-lime-300 font-semibold">{count} selected elements</span> with consistent horizontal &amp; vertical spacing, preventing overlapping notes and messy clusters.
            </p>
          </div>
        </div>

        {/* Error state if any */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 flex-1">
              <p className="font-medium text-rose-300">Layout Optimization Failed</p>
              <p className="mt-0.5 text-rose-200/80">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry layout analysis
                </button>
              )}
            </div>
          </div>
        )}

        {/* Layout coordinates summary */}
        {!error && layoutUpdates.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-3.5 space-y-2.5 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>Element</span>
              <span>Before (x, y) &rarr; After (x, y)</span>
            </div>
            <div className="space-y-1.5 divide-y divide-slate-800/60">
              {layoutUpdates.map((update, idx) => {
                const original = selectedElements.find((e) => e.id === update.id);
                const origX = original && 'x' in original ? Math.round(original.x as number) : 0;
                const origY = original && 'y' in original ? Math.round(original.y as number) : 0;
                const label = original 
                  ? ('text' in original && original.text ? `"${String(original.text).slice(0, 18)}..."` : original.type)
                  : `Item #${idx + 1}`;

                return (
                  <div key={update.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">{label}</span>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <span>({origX}, {origY})</span>
                      <ArrowRight className="h-3 w-3 text-slate-600" />
                      <span className="text-lime-400 font-semibold">({Math.round(update.x)}, {Math.round(update.y)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User confirmation reminder */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2 px-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span>You can always undo (Ctrl+Z) if the rearranged positions do not match your preference.</span>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            disabled={layoutUpdates.length === 0}
            className="bg-lime-500 text-slate-950 font-semibold hover:bg-lime-400 shadow-none"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Apply Clean Layout
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
