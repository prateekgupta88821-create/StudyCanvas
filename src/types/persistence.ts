import { WhiteboardProject } from './whiteboard';
import { DriveFileMetadata } from './drive';

export type SaveStatus = 
  | 'idle' 
  | 'saving' 
  | 'saved' 
  | 'error' 
  | 'conflict' 
  | 'auth_expired' 
  | 'offline';

export interface RecoveryDraft {
  projectId: string;
  project: WhiteboardProject;
  savedAt: number;
  parentRevisionId?: string;
  isRecoveryDraft: true;
  changeCount: number;
}

export type ConflictResolutionAction = 'keep_local' | 'load_remote' | 'save_copy';

export interface ConflictInfo {
  projectId: string;
  localTitle: string;
  localModifiedTime: number;
  remoteModifiedTime: number | string;
  remoteFile?: DriveFileMetadata;
  source: 'google_drive' | 'tab_concurrency' | 'remote_sync';
}

export interface PersistenceConfig {
  debounceMs: number;
  maxRetries: number;
  baseRetryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface PersistenceState {
  status: SaveStatus;
  lastSavedAt: number | null;
  isDirty: boolean;
  error: string | null;
  pendingWritesCount: number;
}
