import React, { useState } from 'react';
import { 
  CheckCircle2, 
  RotateCw, 
  HardDrive, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { DriveAuthModal } from './DriveAuthModal';
import { DriveConflictModal } from './DriveConflictModal';

export interface DriveStatusBadgeProps {
  className?: string;
  driveWebViewLink?: string;
  showReconnectButton?: boolean;
}

export const DriveStatusBadge: React.FC<DriveStatusBadgeProps> = ({
  className = '',
  driveWebViewLink,
  showReconnectButton = true,
}) => {
  const {
    isConnected,
    isConnecting,
    syncStatus,
    conflict,
    resolveConflict,
    clearConflict,
  } = useGoogleDrive();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Pure formatted sync time
  const formatSyncTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {syncStatus.state === 'syncing' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs animate-pulse">
            <RotateCw className="h-3 w-3 animate-spin" />
            <span className="font-medium hidden sm:inline">Syncing to Drive...</span>
            <span className="font-medium sm:hidden">Syncing</span>
          </div>
        ) : syncStatus.state === 'conflict' ? (
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
          >
            <ShieldAlert className="h-3 w-3" />
            <span className="font-medium">Drive Conflict</span>
          </button>
        ) : isConnected ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors group"
              title={
                syncStatus.lastSyncedAt
                  ? `Last synced with Google Drive ${formatSyncTime(syncStatus.lastSyncedAt)}`
                  : 'Connected to Google Drive'
              }
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="font-medium hidden sm:inline">Drive Synced</span>
              {syncStatus.lastSyncedAt && (
                <span className="text-[10px] text-emerald-300/80 hidden md:inline">
                  • {formatSyncTime(syncStatus.lastSyncedAt)}
                </span>
              )}
            </button>

            {driveWebViewLink && (
              <a
                href={driveWebViewLink}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Open in Google Drive"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : (
          showReconnectButton && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/20 hover:border-amber-500/30 transition-all font-medium"
            >
              <HardDrive className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Connect Drive</span>
              <span className="sm:hidden">Drive</span>
              {syncStatus.error && (
                <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
              )}
            </button>
          )
        )}
      </div>

      <DriveAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <DriveConflictModal
        isOpen={Boolean(conflict)}
        conflict={conflict}
        onClose={clearConflict}
        onResolve={resolveConflict}
      />
    </>
  );
};
