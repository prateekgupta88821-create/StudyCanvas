import { WhiteboardProject } from '@/types/whiteboard';
import { 
  DriveFileMetadata, 
  DriveSaveResult, 
  StudyCanvasProjectFile,
  STUDYCANVAS_APP_ID,
  STUDYCANVAS_SCHEMA_VERSION,
  STUDYCANVAS_FILE_EXTENSION,
  DriveConflictDetails,
  DriveRevisionItem
} from '@/types/drive';
import { assetStorageService } from './assetStorageService';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export class DriveApiError extends Error {
  code: string;
  status: number;
  isTokenExpired: boolean;
  isRateLimited: boolean;

  constructor(message: string, status: number, code: string = 'drive/api-error') {
    super(message);
    this.name = 'DriveApiError';
    this.status = status;
    this.code = code;
    this.isTokenExpired = status === 401;
    this.isRateLimited = status === 429;
  }
}

export class DriveConflictError extends Error {
  conflictDetails: DriveConflictDetails;

  constructor(message: string, conflictDetails: DriveConflictDetails) {
    super(message);
    this.name = 'DriveConflictError';
    this.conflictDetails = conflictDetails;
  }
}

/**
 * Fetch helper with automatic exponential backoff for rate limits and server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  let delay = 500;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);

      // Handle token expiration immediately
      if (response.status === 401) {
        throw new DriveApiError(
          'Google Drive access token has expired or is invalid. Please reconnect Google Drive.',
          401,
          'drive/token-expired'
        );
      }

      // Handle permission issues
      if (response.status === 403) {
        const errText = await response.text();
        if (errText.includes('rateLimitExceeded') || errText.includes('userRateLimitExceeded')) {
          // Rate limit exceeded: retry
          attempt++;
          if (attempt >= maxRetries) {
            throw new DriveApiError('Google Drive rate limit exceeded. Please wait a moment.', 429, 'drive/rate-limited');
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        throw new DriveApiError(
          'Insufficient permissions for Google Drive. Re-authorize StudyCanvas with drive.file scope.',
          403,
          'drive/insufficient-permissions'
        );
      }

      // Handle server error (500, 502, 503, 504): retry
      if (response.status >= 500 && attempt < maxRetries - 1) {
        attempt++;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      return response;
    } catch (err: any) {
      if (err instanceof DriveApiError) throw err;
      attempt++;
      if (attempt >= maxRetries) {
        throw new DriveApiError(
          err.message || 'Network error while communicating with Google Drive.',
          0,
          'drive/network-error'
        );
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new DriveApiError('Failed to complete Google Drive request after retries.', 0, 'drive/max-retries-exceeded');
}

export const googleDriveService = {
  /**
   * Builds the standard StudyCanvas documented JSON file content with asset externalization
   */
  buildProjectFilePayload(project: WhiteboardProject): StudyCanvasProjectFile {
    const { compactProject, manifest } = assetStorageService.extractAssets(project);
    return {
      $schema: 'https://studycanvas.app/schemas/project-v1.json',
      format: 'studycanvas',
      schemaVersion: STUDYCANVAS_SCHEMA_VERSION,
      exportedAt: Date.now(),
      project: {
        ...compactProject,
        schemaVersion: STUDYCANVAS_SCHEMA_VERSION,
      },
      assetsManifest: Object.keys(manifest).length > 0 ? manifest : undefined,
    };
  },

  /**
   * Uploads or updates a Whiteboard Project file (.studycanvas) on Google Drive.
   * Includes conflict detection, duplicate prevention, and non-overwrite safeguards.
   */
  async uploadProjectToDrive(
    project: WhiteboardProject,
    accessToken: string,
    options: { forceOverwrite?: boolean } = {}
  ): Promise<DriveSaveResult> {
    if (!accessToken) {
      throw new DriveApiError('Google Drive access token is required.', 401, 'drive/token-missing');
    }

    const safeTitle = (project.title || 'Untitled Whiteboard').trim();
    const fileName = safeTitle.endsWith(STUDYCANVAS_FILE_EXTENSION)
      ? safeTitle
      : `${safeTitle}${STUDYCANVAS_FILE_EXTENSION}`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `StudyCanvas Whiteboard: ${project.subject || 'Education'} (Owner: ${project.ownerEmail || project.ownerId})`,
      appProperties: {
        app: STUDYCANVAS_APP_ID,
        projectId: project.id,
        subject: project.subject || 'General',
        ownerId: project.ownerId,
        pagesCount: String(project.pages.length),
        version: String(project.version || 1),
        schemaVersion: STUDYCANVAS_SCHEMA_VERSION,
      },
    };

    const projectPayload = this.buildProjectFilePayload(project);
    const fileContent = JSON.stringify(projectPayload, null, 2);

    const boundary = '-------StudyCanvasMultipartBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    let targetFileId = project.driveFileId;

    // Idempotency & Duplicate Prevention:
    // If no driveFileId is provided, check if a file with this projectId already exists in Drive
    if (!targetFileId) {
      const existingFile = await this.findFileByProjectId(project.id, accessToken);
      if (existingFile) {
        targetFileId = existingFile.id;
      }
    }

    // If updating an existing file, check for conflicts and non-overwrite safety
    if (targetFileId) {
      const remoteMeta = await this.getFileMetadata(targetFileId, accessToken);

      if (remoteMeta) {
        // Safe non-overwrite: Ensure we never overwrite non-StudyCanvas files
        const isStudyCanvasFile =
          remoteMeta.appProperties?.app === STUDYCANVAS_APP_ID ||
          remoteMeta.name.endsWith(STUDYCANVAS_FILE_EXTENSION);

        if (!isStudyCanvasFile) {
          throw new DriveApiError(
            `Target Drive file (${remoteMeta.name}) was not created by StudyCanvas. Refusing to overwrite arbitrary files.`,
            400,
            'drive/safety-check-failed'
          );
        }

        // Conflict detection: If remote file was modified after our last sync
        if (!options.forceOverwrite && remoteMeta.modifiedTime && project.driveSyncedAt) {
          const remoteTime = new Date(remoteMeta.modifiedTime).getTime();
          // If remote was modified more than 5 seconds after our last sync
          if (remoteTime > project.driveSyncedAt + 5000) {
            throw new DriveConflictError(
              `The whiteboard "${project.title}" was modified in Google Drive from another device or session.`,
              {
                localProject: project,
                remoteFile: remoteMeta,
                remoteModifiedTime: remoteMeta.modifiedTime,
                localModifiedTime: project.updatedAt,
              }
            );
          }
        }
      }
    }

    const isUpdate = Boolean(targetFileId);
    const url = isUpdate
      ? `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=multipart&fields=id,name,webViewLink,version,headRevisionId,modifiedTime`
      : `${DRIVE_UPLOAD_URL}&fields=id,name,webViewLink,version,headRevisionId,modifiedTime`;

    const response = await fetchWithRetry(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new DriveApiError(`Google Drive save failed (${response.status}): ${errText}`, response.status);
    }

    const data = await response.json();
    return {
      fileId: data.id,
      name: data.name,
      webViewLink: data.webViewLink,
      revisionId: data.headRevisionId || data.version,
      modifiedTime: data.modifiedTime,
      syncedAt: Date.now(),
    };
  },

  /**
   * Retrieves metadata for a specific Google Drive file
   */
  async getFileMetadata(fileId: string, accessToken: string): Promise<DriveFileMetadata | null> {
    try {
      const url = `${DRIVE_FILES_URL}/${fileId}?fields=id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,iconLink,appProperties,headRevisionId,version`;
      const response = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  },

  /**
   * Finds an existing file in Google Drive associated with the given StudyCanvas projectId
   */
  async findFileByProjectId(projectId: string, accessToken: string): Promise<DriveFileMetadata | null> {
    try {
      const query = `trashed = false and appProperties has { key='app' and value='${STUDYCANVAS_APP_ID}' } and appProperties has { key='projectId' and value='${projectId}' }`;
      const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink,appProperties)&pageSize=1`;

      const response = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.files?.[0] || null;
    } catch {
      return null;
    }
  },

  /**
   * Lists all StudyCanvas whiteboard files created or accessible in the user's Google Drive.
   * Clearly flags native .studycanvas files vs general documents.
   */
  async listWhiteboardFiles(
    accessToken: string,
    options: { searchQuery?: string; pageSize?: number } = {}
  ): Promise<DriveFileMetadata[]> {
    if (!accessToken) return [];

    const pageSize = options.pageSize || 50;
    // Query files that match .studycanvas or StudyCanvas appProperty
    let query = `trashed = false and (name contains '${STUDYCANVAS_FILE_EXTENSION}' or appProperties has { key='app' and value='${STUDYCANVAS_APP_ID}' })`;

    if (options.searchQuery?.trim()) {
      const safeSearch = options.searchQuery.replace(/'/g, "\\'");
      query += ` and name contains '${safeSearch}'`;
    }

    const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,iconLink,appProperties,headRevisionId,version)&orderBy=modifiedTime desc&pageSize=${pageSize}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Failed to list Google Drive files (${response.status}):`, errText);
      return [];
    }

    const data = await response.json();
    const files: DriveFileMetadata[] = data.files || [];

    // Tag files with isNative flag
    return files.map((file) => ({
      ...file,
      isNative:
        file.appProperties?.app === STUDYCANVAS_APP_ID ||
        file.name.endsWith(STUDYCANVAS_FILE_EXTENSION),
    }));
  },

  /**
   * Downloads and parses a Whiteboard project from Google Drive (.studycanvas).
   * Validates project schema and attaches confirmed Drive file reference.
   */
  async downloadProjectFromDrive(fileId: string, accessToken: string): Promise<WhiteboardProject> {
    if (!accessToken) {
      throw new DriveApiError('Google Drive access token missing.', 401, 'drive/token-missing');
    }

    // First fetch file metadata to verify it is a valid StudyCanvas file
    const meta = await this.getFileMetadata(fileId, accessToken);
    if (meta) {
      const isStudyCanvas =
        meta.appProperties?.app === STUDYCANVAS_APP_ID ||
        meta.name.endsWith(STUDYCANVAS_FILE_EXTENSION);

      if (!isStudyCanvas && meta.mimeType.includes('google-apps')) {
        throw new DriveApiError(
          `Cannot open "${meta.name}" directly: Google Docs/Sheets cannot be loaded as whiteboard canvas files.`,
          400,
          'drive/unsupported-file-type'
        );
      }
    }

    const downloadUrl = `${DRIVE_FILES_URL}/${fileId}?alt=media`;
    const response = await fetchWithRetry(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new DriveApiError(
        `Failed to download project from Google Drive (${response.status})`,
        response.status
      );
    }

    const rawData = await response.json();

    // Check if file uses wrapped StudyCanvasProjectFile format
    let project: WhiteboardProject;
    if (rawData.format === 'studycanvas' && rawData.project) {
      project = assetStorageService.hydrateProject(rawData.project, rawData.assetsManifest);
    } else if (rawData.id && Array.isArray(rawData.pages)) {
      // Direct WhiteboardProject format fallback
      project = rawData as WhiteboardProject;
    } else {
      throw new DriveApiError(
        'The selected file does not contain valid StudyCanvas whiteboard data.',
        400,
        'drive/corrupted-file'
      );
    }

    // Attach confirmed Drive file reference & metadata
    return {
      ...project,
      driveFileId: fileId,
      driveWebViewLink: meta?.webViewLink || project.driveWebViewLink,
      driveRevisionId: meta?.headRevisionId || meta?.version,
      driveSyncedAt: meta?.modifiedTime ? new Date(meta.modifiedTime).getTime() : Date.now(),
      schemaVersion: STUDYCANVAS_SCHEMA_VERSION,
    };
  },

  /**
   * Permanently deletes or trashes a file from Google Drive
   */
  async deleteFileFromDrive(fileId: string, accessToken: string): Promise<void> {
    if (!accessToken) return;

    const url = `${DRIVE_FILES_URL}/${fileId}`;
    const response = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok && response.status !== 404) {
      throw new DriveApiError(`Failed to delete Google Drive file (${response.status})`, response.status);
    }
  },

  /**
   * Lists historical revisions of a project file in Google Drive
   */
  async listFileRevisions(fileId: string, accessToken: string): Promise<DriveRevisionItem[]> {
    if (!accessToken) return [];
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,mimeType,modifiedTime,keepForever,size)&pageSize=50`;
      const response = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.revisions || []).map((r: any) => ({
        id: r.id,
        modifiedTime: r.modifiedTime,
        keepForever: Boolean(r.keepForever),
        size: r.size ? Number(r.size) : undefined,
      }));
    } catch (e) {
      console.warn('Failed to list Drive revisions:', e);
      return [];
    }
  },

  /**
   * Downloads a specific historical revision from Google Drive
   */
  async downloadFileRevision(fileId: string, revisionId: string, accessToken: string): Promise<WhiteboardProject> {
    if (!accessToken) {
      throw new DriveApiError('Access token required to fetch revision.', 401, 'drive/token-missing');
    }
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?alt=media`;
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new DriveApiError(`Failed to fetch revision (${response.status})`, response.status);
    }
    const rawData = await response.json();
    const project: WhiteboardProject = rawData.format === 'studycanvas' && rawData.project ? rawData.project : rawData;
    return {
      ...project,
      driveFileId: fileId,
      driveRevisionId: revisionId,
      schemaVersion: STUDYCANVAS_SCHEMA_VERSION,
    };
  },

  /**
   * Restores a past revision by downloading it and committing it as the new head revision
   */
  async restoreFileRevision(fileId: string, revisionId: string, accessToken: string): Promise<WhiteboardProject> {
    const historicalProject = await this.downloadFileRevision(fileId, revisionId, accessToken);
    const updatedProject: WhiteboardProject = {
      ...historicalProject,
      driveFileId: fileId,
      updatedAt: Date.now(),
      version: (historicalProject.version || 1) + 1,
    };
    await this.uploadProjectToDrive(updatedProject, accessToken, { forceOverwrite: true });
    return updatedProject;
  },
};
