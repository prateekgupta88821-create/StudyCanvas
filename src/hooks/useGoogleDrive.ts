import { useState, useCallback, useEffect, useMemo } from 'react';
import { googleDriveService, DriveConflictError, DriveApiError } from '@/services/googleDriveService';
import { googleIdentityService } from '@/services/googleIdentityService';
import { firestoreService } from '@/services/firestoreService';
import { storage } from '@/utils/storage';
import { 
  DriveFileMetadata, 
  DriveSyncStatus, 
  DriveConflictDetails,
  DriveSaveResult 
} from '@/types/drive';
import { WhiteboardProject } from '@/types/whiteboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useGoogleDrive() {
  const { driveAccessToken, refreshDriveToken } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [remoteFiles, setRemoteFiles] = useState<DriveFileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [conflict, setConflict] = useState<DriveConflictDetails | null>(null);

  const [syncStatusState, setSyncStatusState] = useState<DriveSyncStatus>({
    state: 'idle',
    lastSyncedAt: undefined,
    error: null,
  });

  const isConfigured = googleIdentityService.isConfigured();
  const isExpired = googleIdentityService.isExpired();
  const hasToken = Boolean(driveAccessToken && !isExpired);

  const loadDriveFiles = useCallback(async (searchQuery?: string): Promise<DriveFileMetadata[]> => {
    let token = googleIdentityService.getValidToken() || driveAccessToken;
    if (!token) {
      setRemoteFiles([]);
      return [];
    }

    setLoading(true);
    try {
      const files = await googleDriveService.listWhiteboardFiles(token, { searchQuery });
      setRemoteFiles(files);
      return files;
    } catch (err: any) {
      if (err instanceof DriveApiError && err.isTokenExpired) {
        setSyncStatusState({ state: 'disconnected', error: 'Google Drive authorization expired.' });
      } else {
        setSyncStatusState((prev) => ({ ...prev, error: err.message }));
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [driveAccessToken]);

  useEffect(() => {
    if (!hasToken) return;

    let isCancelled = false;
    googleDriveService.listWhiteboardFiles(driveAccessToken!)
      .then((files) => {
        if (!isCancelled) {
          setRemoteFiles(files);
          setSyncStatusState({ state: 'idle', error: null });
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          setSyncStatusState((prev) => ({ ...prev, error: err.message }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hasToken, driveAccessToken]);

  const connectDrive = useCallback(async (prompt?: 'consent' | ''): Promise<string | null> => {
    setIsConnecting(true);
    try {
      let token: string | null = null;
      if (isConfigured) {
        token = await googleIdentityService.requestDriveAccessToken({ prompt });
      } else {
        token = await refreshDriveToken();
      }

      if (token) {
        success('Connected to Google Drive. Whiteboards will sync automatically.', 'Google Drive Connected');
        setSyncStatusState({ state: 'idle', error: null });
        await loadDriveFiles();
      }
      return token;
    } catch (err: any) {
      const msg = err.message || 'Failed to connect to Google Drive.';
      if (err?.code === 'auth/popup-closed') {
        info('Google authorization popup was closed.', 'Drive Authorization');
      } else {
        toastError(msg, 'Google Drive Error');
      }
      setSyncStatusState({ state: 'error', error: msg });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isConfigured, refreshDriveToken, loadDriveFiles, success, info, toastError]);

  const disconnectDrive = useCallback(async () => {
    try {
      await googleIdentityService.revokeDriveAccess();
      setRemoteFiles([]);
      setSyncStatusState({ state: 'disconnected', error: null });
      info('Google Drive disconnected.', 'Disconnected');
    } catch (e: any) {
      console.warn('Failed to disconnect Drive:', e);
    }
  }, [info]);

  const saveToDrive = useCallback(
    async (
      project: WhiteboardProject,
      options: { forceOverwrite?: boolean } = {}
    ): Promise<DriveSaveResult> => {
      let token = googleIdentityService.getValidToken() || driveAccessToken;
      if (!token) {
        token = await refreshDriveToken();
      }

      if (!token) {
        setSyncStatusState({
          state: 'error',
          error: 'Please connect Google Drive to sync this whiteboard.',
        });
        throw new DriveApiError(
          'Google Drive access token missing. Please connect Google Drive.',
          401,
          'drive/token-missing'
        );
      }

      setSyncStatusState({ state: 'syncing', error: null });

      try {
        // Write to Google Drive API
        const result = await googleDriveService.uploadProjectToDrive(project, token, options);

        // Update confirmed Drive metadata in Firestore only AFTER write succeeds
        await firestoreService.updateDriveSyncMetadata(project.id, {
          driveFileId: result.fileId,
          driveWebViewLink: result.webViewLink,
          driveRevisionId: result.revisionId,
          driveSyncedAt: result.syncedAt,
        });

        // Update local storage representation
        storage.updateProjectMeta(project.id, {
          driveFileId: result.fileId,
          driveWebViewLink: result.webViewLink,
          driveRevisionId: result.revisionId,
          driveSyncedAt: result.syncedAt,
        });

        setSyncStatusState({
          state: 'synced',
          lastSyncedAt: result.syncedAt,
          fileId: result.fileId,
          error: null,
        });
        setConflict(null);

        success(`Saved "${project.title}" to Google Drive`, 'Sync Complete');
        return result;
      } catch (err: any) {
        if (err instanceof DriveConflictError) {
          setConflict(err.conflictDetails);
          setSyncStatusState({
            state: 'conflict',
            error: err.message,
            fileId: project.driveFileId,
            remoteModifiedTime: err.conflictDetails.remoteModifiedTime,
          });
          toastError(err.message, 'Version Conflict Detected');
          throw err;
        }

        if (err instanceof DriveApiError && err.isTokenExpired) {
          setSyncStatusState({
            state: 'disconnected',
            error: 'Google Drive authorization expired. Click to reconnect.',
          });
          toastError('Google Drive session expired. Please reconnect.', 'Session Expired');
        } else {
          setSyncStatusState({ state: 'error', error: err.message });
          toastError(err.message || 'Failed to save whiteboard to Google Drive', 'Drive Save Failed');
        }

        // Preserve project in local backup so edits are never lost
        storage.saveProject(project);
        throw err;
      }
    },
    [driveAccessToken, refreshDriveToken, success, toastError]
  );

  const resolveConflict = useCallback(
    async (
      resolution: 'overwrite' | 'save_as_copy',
      customCopyTitle?: string
    ): Promise<DriveSaveResult | null> => {
      if (!conflict) return null;

      if (resolution === 'overwrite') {
        const res = await saveToDrive(conflict.localProject, { forceOverwrite: true });
        setConflict(null);
        return res;
      }

      if (resolution === 'save_as_copy') {
        // Clone project with fresh ID and title
        const copyTitle = customCopyTitle || `${conflict.localProject.title} (New Copy)`;
        const clonedProject: WhiteboardProject = {
          ...conflict.localProject,
          id: 'canvas_' + Math.random().toString(36).substring(2, 9),
          title: copyTitle,
          driveFileId: undefined,
          driveWebViewLink: undefined,
          driveRevisionId: undefined,
          driveSyncedAt: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        };

        await firestoreService.saveProject(clonedProject);
        const res = await saveToDrive(clonedProject);
        setConflict(null);
        info(`Created new copy: "${copyTitle}" and synced to Drive.`, 'Saved as Copy');
        return res;
      }

      return null;
    },
    [conflict, saveToDrive, info]
  );

  const importFromDrive = useCallback(
    async (fileId: string): Promise<WhiteboardProject> => {
      let token = googleIdentityService.getValidToken() || driveAccessToken;
      if (!token) {
        token = await refreshDriveToken();
      }

      if (!token) {
        throw new DriveApiError('Please connect Google Drive to import files.', 401, 'drive/token-missing');
      }

      setLoading(true);
      try {
        const project = await googleDriveService.downloadProjectFromDrive(fileId, token);
        // Persist to local backup and Firestore
        await firestoreService.saveProject(project);
        success(`Imported "${project.title}" from Google Drive`, 'Import Successful');
        return project;
      } catch (err: any) {
        toastError(err.message || 'Failed to import file from Google Drive', 'Import Error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [driveAccessToken, refreshDriveToken, success, toastError]
  );

  const deleteFromDrive = useCallback(
    async (fileId: string): Promise<void> => {
      let token = googleIdentityService.getValidToken() || driveAccessToken;
      if (!token) {
        token = await refreshDriveToken();
      }
      if (!token) return;

      try {
        await googleDriveService.deleteFileFromDrive(fileId, token);
        setRemoteFiles((prev) => prev.filter((f) => f.id !== fileId));
        info('File removed from Google Drive.', 'Drive File Deleted');
      } catch (err: any) {
        toastError(err.message || 'Failed to delete file from Google Drive', 'Delete Error');
        throw err;
      }
    },
    [driveAccessToken, refreshDriveToken, info, toastError]
  );

  const syncStatus: DriveSyncStatus = useMemo(() => {
    if (!hasToken) {
      return { state: 'disconnected', error: null };
    }
    return syncStatusState;
  }, [hasToken, syncStatusState]);

  return {
    driveFiles: remoteFiles,
    loading,
    isConnecting,
    isConfigured,
    isExpired,
    isConnected: hasToken,
    syncStatus,
    conflict,
    connectDrive,
    disconnectDrive,
    loadDriveFiles,
    saveToDrive,
    resolveConflict,
    importFromDrive,
    deleteFromDrive,
    clearConflict: () => setConflict(null),
  };
}
