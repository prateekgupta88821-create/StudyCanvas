import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { RecoveryDraft } from '@/types/persistence';
import { RotateCcw, Trash2, ShieldAlert, Clock, Layers } from 'lucide-react';

export interface RecoveryDialogProps {
  isOpen: boolean;
  draft: RecoveryDraft | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export const RecoveryDialog: React.FC<RecoveryDialogProps> = ({
  isOpen,
  draft,
  onRestore,
  onDiscard,
}) => {
  if (!draft) return null;

  const savedDate = new Date(draft.savedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const totalElements = draft.project.pages.reduce(
    (acc, p) => acc + (p.elements?.length || 0),
    0
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDiscard}
      title="Unsaved Work Detected"
      description="StudyCanvas recovered unsaved drawings from an interrupted browser session."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-white">Unsaved recovery snapshot available</p>
            <p className="mt-0.5 text-slate-400">
              We recovered changes saved locally before the browser was refreshed or disconnected.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-lime-400" />
            <span>Saved at: {savedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="h-3.5 w-3.5" />
            <span>{draft.project.pages.length} slides, {totalElements} elements</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            size="sm"
            onClick={onRestore}
            className="flex-1 bg-lime-500 text-slate-950 font-bold hover:bg-lime-400 text-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore Unsaved Changes
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="flex-1 border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 text-xs"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Discard Draft
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
