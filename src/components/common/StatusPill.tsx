import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DriveSyncState } from '@/types/drive';

export const StatusPill: React.FC<{
  state: DriveSyncState;
  lastSyncedAt?: number;
  className?: string;
}> = ({ state, lastSyncedAt, className }) => {
  switch (state) {
    case 'syncing':
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/25 ${className || ''}`}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Saving to Drive...</span>
        </div>
      );
    case 'synced':
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/25 ${className || ''}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Drive Synced</span>
        </div>
      );
    case 'error':
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/25 ${className || ''}`}>
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Sync Error</span>
        </div>
      );
    case 'conflict':
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/25 ${className || ''}`}>
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Drive Conflict</span>
        </div>
      );
    case 'disconnected':
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-700 ${className || ''}`}>
          <CloudOff className="h-3.5 w-3.5" />
          <span>Offline Storage</span>
        </div>
      );
    case 'idle':
    default:
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/80 ${className || ''}`}>
          <Cloud className="h-3.5 w-3.5 text-slate-400" />
          <span>{lastSyncedAt ? 'Saved' : 'Ready'}</span>
        </div>
      );
  }
};
