import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ConflictInfo } from '@/types/persistence';
import { AlertTriangle, Copy, Upload, DownloadCloud } from 'lucide-react';

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflict: ConflictInfo | null;
  onKeepLocal: () => void;
  onLoadRemote: () => void;
  onSaveCopy: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  conflict,
  onKeepLocal,
  onLoadRemote,
  onSaveCopy,
}) => {
  if (!conflict) return null;

  const localTime = new Date(conflict.localModifiedTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const remoteTime = typeof conflict.remoteModifiedTime === 'number'
    ? new Date(conflict.remoteModifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : String(conflict.remoteModifiedTime);

  const sourceDescription = conflict.source === 'google_drive'
    ? 'Google Drive file was modified from another device or session.'
    : conflict.source === 'tab_concurrency'
    ? 'This project was saved in another browser tab.'
    : 'A concurrent cloud modification was detected.';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {}} // User must deliberately resolve the conflict
      title="Whiteboard Conflict Detected"
      description="Multiple concurrent edits were detected for this project."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-white">Conflicting Versions Found</p>
            <p className="mt-0.5 text-slate-400">
              {sourceDescription} Choose how you want to resolve these changes to avoid overwriting work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] uppercase font-bold text-lime-400 block mb-1">Your Version</span>
            <span className="text-slate-200 block truncate">{conflict.localTitle}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Last modified: {localTime}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Remote Version</span>
            <span className="text-slate-200 block truncate">{conflict.remoteFile?.name || 'Cloud File'}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Modified: {remoteTime}</span>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-2 pt-1">
          {/* Option 1: Save as Copy (Recommended) */}
          <Button
            size="sm"
            onClick={onSaveCopy}
            className="w-full bg-lime-500 text-slate-950 font-bold hover:bg-lime-400 text-xs justify-start h-auto py-2.5 px-3"
          >
            <Copy className="mr-2 h-4 w-4 shrink-0" />
            <div className="text-left">
              <p className="font-semibold">Save as a New Copy (Recommended)</p>
              <p className="text-[10px] font-normal opacity-80">Preserves both your local changes and the cloud version without losing anything.</p>
            </div>
          </Button>

          {/* Option 2: Overwrite Cloud with Local */}
          <Button
            variant="outline"
            size="sm"
            onClick={onKeepLocal}
            className="w-full border-slate-700 hover:border-lime-500/50 text-slate-200 text-xs justify-start h-auto py-2.5 px-3"
          >
            <Upload className="mr-2 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-left">
              <p className="font-semibold">Keep My Version & Overwrite Cloud</p>
              <p className="text-[10px] font-normal text-slate-400">Forces your local drawings to overwrite the external cloud version.</p>
            </div>
          </Button>

          {/* Option 3: Discard Local & Load Cloud */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadRemote}
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs justify-start h-auto py-2 px-3"
          >
            <DownloadCloud className="mr-2 h-4 w-4 shrink-0 text-sky-400" />
            <div className="text-left">
              <p className="font-semibold">Load Cloud Version (Discard Local Edits)</p>
              <p className="text-[10px] font-normal text-slate-500">Replaces your current canvas with the newest file from Google Drive.</p>
            </div>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
