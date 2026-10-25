import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { WhiteboardProject } from '@/types/whiteboard';
import { HardDrive, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { formatBytes } from '@/utils/formatters';

export interface DriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (project: WhiteboardProject) => void;
}

export const DriveImportModal: React.FC<DriveImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const { driveFiles, loading, isConnected, loadDriveFiles, importFromDrive } = useGoogleDrive();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (fileId: string) => {
    setError(null);
    setImportingId(fileId);
    try {
      const project = await importFromDrive(fileId);
      onImport(project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import file from Google Drive');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import Whiteboard from Google Drive"
      description="Select any .studycanvas file stored in your Google Drive to open and continue editing."
    >
      <div className="space-y-4 pt-2">
        {!isConnected ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-center">
            <HardDrive className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Google Drive Not Connected</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Sign in with your Google account and grant Drive file permissions to access your saved whiteboards.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Found {driveFiles.length} whiteboard {driveFiles.length === 1 ? 'file' : 'files'} in your Drive
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadDriveFiles}
                disabled={loading}
                className="h-8 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {driveFiles.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center text-slate-400">
                <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">No .studycanvas files found in your Google Drive yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Create a new whiteboard and click "Save to Drive" to see it here.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Drive File'}
                          {file.size ? ` • ${formatBytes(parseInt(file.size, 10))}` : ''}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleImport(file.id)}
                      isLoading={importingId === file.id}
                      className="shrink-0 text-xs h-8"
                    >
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
