import React, { useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { WhiteboardProject } from '@/types/whiteboard';
import { 
  HardDrive, 
  RefreshCw, 
  FileText, 
  AlertCircle, 
  Search, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { formatBytes } from '@/utils/formatters';
import { DriveAuthModal } from '@/components/drive/DriveAuthModal';

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
  const { driveFiles, loading, isConnected, isExpired, loadDriveFiles, importFromDrive } = useGoogleDrive();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return driveFiles;
    const q = searchQuery.toLowerCase();
    return driveFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.appProperties?.subject?.toLowerCase().includes(q)
    );
  }, [driveFiles, searchQuery]);

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
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Open from Google Drive"
        description="Select any .studycanvas whiteboard stored in your Google Drive to open and continue editing."
      >
        <div className="space-y-4 pt-1">
          {!isConnected || isExpired ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mx-auto">
                <HardDrive className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Google Drive Not Connected</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                  Authorize StudyCanvas to access your Google Drive whiteboards using Google Identity Services.
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-lime-500 text-slate-950 hover:bg-lime-400 font-semibold text-xs mt-2"
              >
                Connect Google Drive
              </Button>
            </div>
          ) : (
            <>
              {/* Search & Refresh Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search whiteboards in Drive..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-500/50"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadDriveFiles(searchQuery)}
                  disabled={loading}
                  className="h-8 text-xs shrink-0 text-slate-300 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* File List */}
              {filteredFiles.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center text-slate-400">
                  <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-medium text-slate-300">
                    {searchQuery ? 'No matching whiteboards found in Drive.' : 'No StudyCanvas files found yet.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Whiteboards saved to Google Drive from StudyCanvas will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {filteredFiles.map((file) => {
                    const isNative = file.isNative ?? file.name.endsWith('.studycanvas');
                    const subject = file.appProperties?.subject;
                    const pagesCount = file.appProperties?.pagesCount;

                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isNative
                              ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                              {isNative && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-lime-500/10 text-lime-400 border border-lime-500/20">
                                  <Sparkles className="h-2.5 w-2.5" /> Native
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              {subject && (
                                <span className="text-slate-300 font-medium">{subject}</span>
                              )}
                              {pagesCount && (
                                <span className="flex items-center gap-0.5">
                                  <Layers className="h-2.5 w-2.5 text-slate-500" /> {pagesCount} pages
                                </span>
                              )}
                              {file.modifiedTime && (
                                <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                              )}
                              {file.size && <span>• {formatBytes(parseInt(file.size, 10))}</span>}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleImport(file.id)}
                          isLoading={importingId === file.id}
                          className="shrink-0 text-xs h-8 bg-slate-800 text-white hover:bg-lime-500 hover:text-slate-950 font-medium"
                        >
                          Open
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            {isConnected && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected to Google Drive
              </span>
            )}
            <div className="flex justify-end ml-auto">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <DriveAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => void loadDriveFiles()}
      />
    </>
  );
};
