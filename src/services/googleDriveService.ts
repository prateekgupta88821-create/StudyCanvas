import { WhiteboardProject } from '@/types/whiteboard';
import { DriveFileMetadata } from '@/types/drive';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export const googleDriveService = {
  /**
   * Uploads or updates a Whiteboard Project file (.studycanvas) to Google Drive
   */
  async uploadProjectToDrive(
    project: WhiteboardProject,
    accessToken: string
  ): Promise<{ fileId: string; webViewLink?: string }> {
    if (!accessToken) {
      throw new Error('Google Drive access token is required. Please sign in with Google Drive permissions.');
    }

    const fileName = `${project.title || 'Untitled Whiteboard'}.studycanvas`;
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `StudyCanvas Whiteboard: ${project.subject || 'Education'}`,
      appProperties: {
        app: 'StudyCanvas',
        projectId: project.id,
        subject: project.subject || 'General',
        pagesCount: String(project.pages.length),
        version: '1.0'
      }
    };

    const fileContent = JSON.stringify(project, null, 2);
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

    // If project already has a driveFileId, update it; otherwise create a new file
    const isUpdate = Boolean(project.driveFileId);
    const url = isUpdate 
      ? `https://www.googleapis.com/upload/drive/v3/files/${project.driveFileId}?uploadType=multipart&fields=id,name,webViewLink`
      : `${DRIVE_UPLOAD_URL}&fields=id,name,webViewLink`;

    const response = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      fileId: data.id,
      webViewLink: data.webViewLink,
    };
  },

  /**
   * Lists all StudyCanvas files created in the user's Google Drive
   */
  async listWhiteboardFiles(accessToken: string): Promise<DriveFileMetadata[]> {
    if (!accessToken) {
      return [];
    }

    // Query files that have StudyCanvas appProperty and are not trashed
    const query = "trashed = false and (name contains '.studycanvas' or appProperties has { key='app' and value='StudyCanvas' })";
    const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,iconLink,appProperties)&orderBy=modifiedTime desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Failed to list Google Drive files (${response.status}):`, errText);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  },

  /**
   * Downloads a Whiteboard project JSON from Google Drive
   */
  async downloadProjectFromDrive(fileId: string, accessToken: string): Promise<WhiteboardProject> {
    if (!accessToken) {
      throw new Error('Google Drive access token missing.');
    }

    const url = `${DRIVE_FILES_URL}/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file from Google Drive (${response.status})`);
    }

    const projectData = await response.json();
    // Ensure driveFileId is attached
    return {
      ...projectData,
      driveFileId: fileId,
    };
  }
};
