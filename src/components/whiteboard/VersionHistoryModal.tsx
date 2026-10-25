import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { googleDriveService } from '@/services/googleDriveService';
import { googleIdentityService } from '@/services/googleIdentityService';
import { DriveRevisionItem } from '@/types/drive';
import { History, RotateCcw, Clock, HardDrive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { project, loadProject } = useWhiteboard();
  const { driveAccessToken } = useAuth();

  const [revisions, setRevisions] = useState<DriveRevisionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setRevisions([]);
      setError(null);
      setSuccessMsg(null);
      return;
    }

    if (!project.driveFileId) {
      return;
    }

    const fetchRevisions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let token = googleIdentityService.getValidToken() || driveAccessToken;
        if (!token && googleIdentityService.isConfigured()) {
          token = await googleIdentityService.requestDriveAccessToken();
        }
        if (!token) {
          setError('Google Drive access token missing. Please authorize Google Drive in settings.');
          return;
        }

        const list = await googleDriveService.listFileRevisions(project.driveFileId!, token);
        // Sort newest first
        list.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
        setRevisions(list);
      } catch (err: any) {
        setError(err.message || 'Failed to load version history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevisions();
  }, [isOpen, project.driveFileId, driveAccessToken]);

  const handleRestore = async (revisionId: string) => {
    if (!project.driveFileId) return;
    setRestoringId(revisionId);
    setError(null);
    setSuccessMsg(null);

    try {
      let token = googleIdentityService.getValidToken() || driveAccessToken;
      if (!token && googleIdentityService.isConfigured()) {
        token = await googleIdentityService.requestDriveAccessToken();
      }
      if (!token) {
        throw new Error('Google Drive access token missing.');
      }

      const restoredProject = await googleDriveService.restoreFileRevision(
        project.driveFileId,
        revisionId,
        token
      );
      loadProject(restoredProject);
      setSuccessMsg('Successfully restored selected revision!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to restore revision.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Google Drive Version History"
      description={`Revision history for "${project.title}"`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        {!project.driveFileId ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Not Synced to Google Drive</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Sync this whiteboard to Google Drive from the top toolbar to automatically track version history and restore past revisions.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
            <p className="text-xs">Loading Google Drive revisions...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : revisions.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-400">
            No previous revisions found for this file yet. Revisions are created automatically each time changes are saved to Google Drive.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {successMsg && (
              <div className="rounded-xl border border-lime-500/20 bg-lime-500/10 p-3 flex items-center gap-2 text-xs text-lime-300 mb-2">
                <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {revisions.map((rev, index) => {
              const date = new Date(rev.modifiedTime);
              const formattedDate = date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isCurrent = rev.id === project.driveRevisionId || index === 0;

              return (
                <div
                  key={rev.id}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'border-lime-500/30 bg-lime-500/5'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-lime-500/20 text-lime-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {formattedDate} at {formattedTime}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>Revision #{revisions.length - index}</span>
                        {rev.size && (
                          <>
                            <span>•</span>
                            <span>{(rev.size / 1024).toFixed(1)} KB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restoringId !== null}
                      onClick={() => handleRestore(rev.id)}
                      className="border-slate-700 bg-slate-800 hover:bg-lime-500/20 hover:text-lime-300 hover:border-lime-500/40 text-xs gap-1.5"
                    >
                      {restoringId === rev.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Restore
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
