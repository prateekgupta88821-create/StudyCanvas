import { useState, useCallback, useEffect } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { DriveFileMetadata, DriveSyncStatus } from '@/types/drive';
import { WhiteboardProject } from '@/types/whiteboard';
import { useAuth } from '@/contexts/AuthContext';

export function useGoogleDrive() {
  const { driveAccessToken, refreshDriveToken } = useAuth();
  const [driveFiles, setDriveFiles] = useState<DriveFileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    state: driveAccessToken ? 'idle' : 'disconnected',
    lastSyncedAt: undefined,
    error: null,
  });

  const loadDriveFiles = useCallback(async () => {
    if (!driveAccessToken) {
      setDriveFiles([]);
      return;
    }
    setLoading(true);
    try {
      const files = await googleDriveService.listWhiteboardFiles(driveAccessToken);
      setDriveFiles(files);
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, error: err.message }));
    } finally {
      setLoading(false);
    }
  }, [driveAccessToken]);

  useEffect(() => {
    if (driveAccessToken) {
      loadDriveFiles();
      setSyncStatus({ state: 'idle', error: null });
    } else {
      setSyncStatus({ state: 'disconnected', error: null });
    }
  }, [driveAccessToken, loadDriveFiles]);

  const saveToDrive = useCallback(async (project: WhiteboardProject) => {
    let token = driveAccessToken;
    if (!token) {
      token = await refreshDriveToken();
    }
    if (!token) {
      setSyncStatus({ state: 'error', error: 'Please grant Google Drive permissions.' });
      throw new Error('Google Drive access token not available');
    }

    setSyncStatus({ state: 'syncing', error: null });
    try {
      const result = await googleDriveService.uploadProjectToDrive(project, token);
      setSyncStatus({
        state: 'synced',
        lastSyncedAt: Date.now(),
        fileId: result.fileId,
        error: null,
      });
      await loadDriveFiles();
      return result;
    } catch (err: any) {
      setSyncStatus({ state: 'error', error: err.message });
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
