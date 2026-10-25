import { useState, useCallback, useEffect, useMemo } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { DriveFileMetadata, DriveSyncStatus } from '@/types/drive';
import { WhiteboardProject } from '@/types/whiteboard';
import { useAuth } from '@/hooks/useAuth';

export function useGoogleDrive() {
  const { driveAccessToken, refreshDriveToken } = useAuth();
  const [remoteFiles, setRemoteFiles] = useState<DriveFileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatusState, setSyncStatusState] = useState<DriveSyncStatus>({
    state: 'idle',
    lastSyncedAt: undefined,
    error: null,
  });

  const loadDriveFiles = useCallback(async () => {
    if (!driveAccessToken) {
      setRemoteFiles([]);
      return;
    }
    setLoading(true);
    try {
      const files = await googleDriveService.listWhiteboardFiles(driveAccessToken);
      setRemoteFiles(files);
    } catch (err: any) {
      setSyncStatusState((prev) => ({ ...prev, error: err.message }));
    } finally {
      setLoading(false);
    }
  }, [driveAccessToken]);

  useEffect(() => {
    if (!driveAccessToken) return;

    let isCancelled = false;
    googleDriveService.listWhiteboardFiles(driveAccessToken)
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
  }, [driveAccessToken]);

  const driveFiles = useMemo(() => {
    return driveAccessToken ? remoteFiles : [];
  }, [driveAccessToken, remoteFiles]);

  const syncStatus: DriveSyncStatus = useMemo(() => {
    if (!driveAccessToken) {
      return { state: 'disconnected', error: null };
    }
    return syncStatusState;
  }, [driveAccessToken, syncStatusState]);

  const saveToDrive = useCallback(async (project: WhiteboardProject) => {
    let token = driveAccessToken;
    if (!token) {
      token = await refreshDriveToken();
    }
    if (!token) {
      setSyncStatusState({ state: 'error', error: 'Please grant Google Drive permissions.' });
      throw new Error('Google Drive access token not available');
    }

    setSyncStatusState({ state: 'syncing', error: null });
    try {
      const result = await googleDriveService.uploadProjectToDrive(project, token);
      setSyncStatusState({
        state: 'synced',
        lastSyncedAt: Date.now(),
        fileId: result.fileId,
        error: null,
      });
      await loadDriveFiles();
      return result;
    } catch (err: any) {
      setSyncStatusState({ state: 'error', error: err.message });
      throw err;
    }
  }, [driveAccessToken, refreshDriveToken, loadDriveFiles]);

  const importFromDrive = useCallback(async (fileId: string): Promise<WhiteboardProject> => {
    let token = driveAccessToken;
    if (!token) {
      token = await refreshDriveToken();
    }
    if (!token) {
      throw new Error('Google Drive access token not available');
    }

    setLoading(true);
    try {
      const project = await googleDriveService.downloadProjectFromDrive(fileId, token);
      return project;
    } finally {
      setLoading(false);
    }
  }, [driveAccessToken, refreshDriveToken]);

  return {
    driveFiles,
    loading,
    syncStatus,
    isConnected: Boolean(driveAccessToken),
    loadDriveFiles,
    saveToDrive,
    importFromDrive,
  };
}
