import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { HardDrive, ShieldCheck, Lock, ExternalLink, AlertTriangle } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';

export interface DriveAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DriveAuthModal: React.FC<DriveAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isConfigured, isConnecting, connectDrive } = useGoogleDrive();

  const handleConnect = async () => {
    const token = await connectDrive('consent');
    if (token) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Google Drive"
      description="Store, sync, and access your educational whiteboards directly from your Google Drive."
    >
      <div className="space-y-5 pt-1">
        {/* Why Drive Permission is Requested */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-400 shrink-0 mt-0.5">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Full User Data Ownership</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                StudyCanvas stores infinite canvas drawings, math proofs, lecture slides, and student annotations
                directly in your personal Google Drive as <code className="text-lime-400 font-mono text-[11px]">.studycanvas</code> files.
                You retain complete ownership and portability of your academic content.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Scopes Explanation */}
        <div className="space-y-2.5">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Privacy & Security Guarantee
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Narrow Scope Only</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Uses <code className="text-slate-300 font-mono text-[10px]">drive.file</code>. We only access files created or opened by StudyCanvas.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Zero Unrelated Access</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  StudyCanvas cannot read, view, or modify your personal emails, photos, or unrelated Google Docs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Config Notice if applicable */}
        {!isConfigured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Google OAuth Client ID Not Configured</p>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                To enable live Google Drive synchronization, create an OAuth 2.0 Web Client ID in Google Cloud Console
                and set <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_GOOGLE_CLIENT_ID</code> in your <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">.env.local</code>.
              </p>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 underline hover:text-white pt-1"
              >
                Open Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            isLoading={isConnecting}
            className="bg-lime-500 text-slate-950 hover:bg-lime-400 font-semibold shadow-lg shadow-lime-500/10"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Authorize Google Drive
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
