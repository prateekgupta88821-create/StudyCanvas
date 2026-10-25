export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  appProperties?: Record<string, string>;
}

export type DriveSyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected';

export interface DriveSyncStatus {
  state: DriveSyncState;
  lastSyncedAt?: number;
  error?: string | null;
  fileId?: string | null;
}
