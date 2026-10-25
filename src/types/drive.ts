import { WhiteboardProject } from './whiteboard';

/**
 * Standard MIME type and file extension used for native StudyCanvas projects
 */
export const STUDYCANVAS_MIME_TYPE = 'application/json';
export const STUDYCANVAS_FILE_EXTENSION = '.studycanvas';
export const STUDYCANVAS_APP_ID = 'StudyCanvas';
export const STUDYCANVAS_SCHEMA_VERSION = '1.0';

/**
 * Narrowest Google Drive OAuth scope: app-created / app-opened files only
 */
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/**
 * Optional broader scope for general Drive file exploration (explained before request)
 */
export const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  headRevisionId?: string;
  version?: string;
  appProperties?: Record<string, string>;
  isNative?: boolean;
}

export type DriveSyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected' | 'conflict';

export interface DriveSyncStatus {
  state: DriveSyncState;
  lastSyncedAt?: number;
  error?: string | null;
  fileId?: string | null;
  remoteModifiedTime?: string;
}

export interface DriveAuthStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isExpired: boolean;
  isConfigured: boolean;
  expiresAt: number | null;
  scope: string | null;
  error?: string | null;
}

export interface DriveAssetManifestItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  driveFileId?: string;
  dataUrl?: string;
  createdAt: number;
}

export interface DriveAssetManifest {
  [assetId: string]: DriveAssetManifestItem;
}

/**
 * Documented JSON Project File format persisted to Google Drive (.studycanvas)
 */
export interface StudyCanvasProjectFile {
  $schema: string;
  format: 'studycanvas';
  schemaVersion: string;
  exportedAt: number;
  project: WhiteboardProject;
  assetsManifest?: DriveAssetManifest;
}

export interface DriveSaveResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  revisionId?: string;
  modifiedTime?: string;
  syncedAt: number;
}

export interface DriveConflictDetails {
  localProject: WhiteboardProject;
  remoteFile: DriveFileMetadata;
  remoteModifiedTime: string;
  localModifiedTime: number;
}

export interface DriveRevisionItem {
  id: string;
  modifiedTime: string;
  keepForever?: boolean;
  size?: number;
}

