import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Copy, ArrowUpCircle, X } from 'lucide-react';
import { DriveConflictDetails } from '@/types/drive';

export interface DriveConflictModalProps {
  isOpen: boolean;
  conflict: DriveConflictDetails | null;
  onClose: () => void;
  onResolve: (resolution: 'overwrite' | 'save_as_copy', customTitle?: string) => Promise<any>;
}

export const DriveConflictModal: React.FC<DriveConflictModalProps> = ({
  isOpen,
  conflict,
  onClose,
  onResolve,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [copyTitle, setCopyTitle] = useState('');

  if (!conflict) return null;

  const remoteDate = conflict.remoteModifiedTime
    ? new Date(conflict.remoteModifiedTime).toLocaleString()
    : 'Recently';
  const localDate = new Date(conflict.localModifiedTime).toLocaleString();

  const handleResolve = async (action: 'overwrite' | 'save_as_copy') => {
    setIsResolving(true);
    try {
      await onResolve(action, copyTitle.trim() || undefined);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Google Drive Sync Conflict"
      description="This whiteboard was modified in Google Drive from another session or device."
    >
      <div className="space-y-4 pt-1">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 space-y-1">
            <p className="font-semibold text-amber-300">Concurrent Edits Detected</p>
            <p>
              To prevent accidental data loss, StudyCanvas did not overwrite the newer version on Google Drive.
            </p>
          </div>
        </div>

        {/* Timestamps comparison */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Your Current Edits
            </span>
            <p className="font-medium text-white truncate">{conflict.localProject.title}</p>
            <p className="text-[11px] text-slate-400 mt-1">{localDate}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Google Drive Remote File
            </span>
            <p className="font-medium text-white truncate">{conflict.remoteFile.name}</p>
            <p className="text-[11px] text-slate-400 mt-1">{remoteDate}</p>
          </div>
        </div>

        {/* Action options */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            How would you like to resolve this?
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Save as New Copy */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-lime-400" />
                    <span className="text-xs font-semibold text-white">Save as New Copy (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Keeps both versions safely intact by saving your current canvas as a new whiteboard in Drive.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleResolve('save_as_copy')}
                  isLoading={isResolving}
                  className="bg-lime-500 text-slate-950 hover:bg-lime-400 text-xs shrink-0 font-medium"
                >
                  Save Copy
                </Button>
              </div>
              <input
                type="text"
                value={copyTitle}
                onChange={(e) => setCopyTitle(e.target.value)}
                placeholder={`Optional custom title (default: ${conflict.localProject.title} (New Copy))`}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-500/50"
              />
            </div>

            {/* Overwrite Remote */}
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:border-red-500/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-semibold text-white">Overwrite Drive Version</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Replace the Drive version with your current canvas. Previous remote edits will be replaced.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleResolve('overwrite')}
                  isLoading={isResolving}
                  className="text-xs shrink-0"
                >
                  Overwrite
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel */}
        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isResolving} className="text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Keep Local Draft & Decide Later
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
