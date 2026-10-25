import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';

export interface AuthExpiredModalProps {
  isOpen: boolean;
  isReconnecting: boolean;
  onReconnect: () => void;
  onDismiss: () => void;
}

export const AuthExpiredModal: React.FC<AuthExpiredModalProps> = ({
  isOpen,
  isReconnecting,
  onReconnect,
  onDismiss,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      title="Google Drive Session Expired"
      description="Your authorization token for Google Drive needs to be refreshed."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-white">Drawings Are Safely Preserved</p>
            <p className="mt-0.5 text-slate-400">
              Your recent whiteboard edits are securely stored in your local recovery cache. Reconnect to resume cloud synchronization.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 text-lime-400 shrink-0" />
          <span>Zero data loss: Cloud sync will resume immediately upon reconnecting.</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={onReconnect}
            isLoading={isReconnecting}
            className="flex-1 bg-lime-500 text-slate-950 font-bold hover:bg-lime-400 text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reconnect Google Drive
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-slate-400 hover:text-white text-xs"
          >
            Later
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
