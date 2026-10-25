import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  googleDriveService, 
  DriveApiError, 
  DriveConflictError 
} from '@/services/googleDriveService';
import { googleIdentityService } from '@/services/googleIdentityService';
import { firestoreService } from '@/services/firestoreService';
import { storage } from '@/utils/storage';
import { WhiteboardProject } from '@/types/whiteboard';
import { STUDYCANVAS_SCHEMA_VERSION, STUDYCANVAS_APP_ID } from '@/types/drive';

// In-memory sessionStorage & localStorage mock
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).sessionStorage = new MemoryStorage();
(globalThis as any).localStorage = new MemoryStorage();

describe('StudyCanvas Google Drive & Google Identity Services Integration', () => {
  const mockToken = 'ya29.test_drive_access_token_12345';
  
  const sampleProject: WhiteboardProject = {
    id: 'proj_electromagnetism_101',
    title: 'Maxwell Equations & Electromagnetic Waves',
    subject: 'Physics',
    tags: ['physics', 'electromagnetism', 'maxwell'],
    description: 'Derivation of wave equations from Faraday and Ampere laws',
    ownerId: 'user_clerk_maxwell',
    ownerEmail: 'maxwell@studycanvas.edu',
    createdAt: 10000,
    updatedAt: 12000,
    version: 1,
    isFavorite: true,
    isTrashed: false,
    activePageIndex: 0,
    pages: [
      {
        id: 'page_1',
        title: 'Faraday Law of Induction',
        backgroundColor: '#090d16',
        gridType: 'dots',
        elements: [],
      },
    ],
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Google Identity Services (GIS) Token Management', () => {
    it('detects missing configuration when client ID is not provided', () => {
      vi.spyOn(googleIdentityService, 'getClientId').mockReturnValue('');
      expect(googleIdentityService.isConfigured()).toBe(false);
    });

    it('detects valid configuration when valid client ID is present', () => {
      vi.spyOn(googleIdentityService, 'getClientId').mockReturnValue('123456789.apps.googleusercontent.com');
      expect(googleIdentityService.isConfigured()).toBe(true);
    });

    it('stores token with expiration and retrieves it before expiry', () => {
      // 3600 seconds = 1 hour
      googleIdentityService.saveToken(mockToken, 3600);

      expect(googleIdentityService.getValidToken()).toBe(mockToken);
      expect(googleIdentityService.isExpired()).toBe(false);
      expect(googleIdentityService.getExpiresAt()).toBeGreaterThan(Date.now());
    });

    it('returns null and flags expired token after expiration window', () => {
      // Token expired 10 seconds ago
      googleIdentityService.saveToken(mockToken, -10);

      expect(googleIdentityService.getValidToken()).toBeNull();
      expect(googleIdentityService.isExpired()).toBe(true);
    });

    it('respects the 60-second safety buffer before true expiration', () => {
      // Token expires in 30 seconds (within the 60s buffer)
      googleIdentityService.saveToken(mockToken, 30);

      expect(googleIdentityService.getValidToken()).toBeNull();
      expect(googleIdentityService.isExpired()).toBe(true);
    });

    it('clears stored token on revoke or logout', async () => {
      googleIdentityService.saveToken(mockToken, 3600);
      expect(googleIdentityService.getValidToken()).toBe(mockToken);

      await googleIdentityService.revokeDriveAccess();
      expect(googleIdentityService.getValidToken()).toBeNull();
    });
  });

  describe('2. Documented Project Format (.studycanvas)', () => {
    it('builds standard documented StudyCanvas project JSON payload', () => {
      const payload = googleDriveService.buildProjectFilePayload(sampleProject);

      expect(payload.format).toBe('studycanvas');
      expect(payload.schemaVersion).toBe(STUDYCANVAS_SCHEMA_VERSION);
      expect(payload.$schema).toContain('project-v1.json');
      expect(payload.exportedAt).toBeGreaterThan(0);
      expect(payload.project.id).toBe('proj_electromagnetism_101');
      expect(payload.project.title).toBe('Maxwell Equations & Electromagnetic Waves');
      expect(payload.project.schemaVersion).toBe('1.0');
    });
  });

  describe('3. Google Drive Upload, Creation & Idempotency', () => {
    it('creates a new file on Google Drive via multipart POST when no driveFileId exists', async () => {
      const mockResponseData = {
        id: 'drive_file_abc123',
        name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
        webViewLink: 'https://drive.google.com/file/d/drive_file_abc123/view',
        headRevisionId: 'rev_1',
        modifiedTime: '2026-10-25T14:00:00Z',
      };

      // Mock fetch
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const urlStr = String(url);
        if (urlStr.includes('uploadType=multipart')) {
          expect(init?.method).toBe('POST');
          expect(init?.headers).toMatchObject({
            Authorization: `Bearer ${mockToken}`,
          });

          // Check multipart body
          const bodyStr = String(init?.body);
          expect(bodyStr).toContain('StudyCanvas');
          expect(bodyStr).toContain(STUDYCANVAS_APP_ID);
          expect(bodyStr).toContain('proj_electromagnetism_101');
          expect(bodyStr).toContain('Faraday Law of Induction');

          return new Response(JSON.stringify(mockResponseData), { status: 200 });
        }

        // findFileByProjectId query returns empty
        if (urlStr.includes('q=')) {
          return new Response(JSON.stringify({ files: [] }), { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
      });

      const result = await googleDriveService.uploadProjectToDrive(sampleProject, mockToken);

      expect(fetchSpy).toHaveBeenCalled();
      expect(result.fileId).toBe('drive_file_abc123');
      expect(result.webViewLink).toBe('https://drive.google.com/file/d/drive_file_abc123/view');
      expect(result.revisionId).toBe('rev_1');
      expect(result.syncedAt).toBeGreaterThan(0);
    });

    it('updates existing file via multipart PATCH when driveFileId exists', async () => {
      const projectWithDrive: WhiteboardProject = {
        ...sampleProject,
        driveFileId: 'drive_file_abc123',
        driveSyncedAt: 12000,
      };

      const mockUpdatedData = {
        id: 'drive_file_abc123',
        name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
        webViewLink: 'https://drive.google.com/file/d/drive_file_abc123/view',
        headRevisionId: 'rev_2',
        modifiedTime: new Date(12000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const urlStr = String(url);

        // Metadata check for safety
        if (urlStr.includes('/files/drive_file_abc123?') && !urlStr.includes('uploadType=multipart')) {
          return new Response(JSON.stringify({
            id: 'drive_file_abc123',
            name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
            mimeType: 'application/json',
            appProperties: { app: STUDYCANVAS_APP_ID, projectId: 'proj_electromagnetism_101' },
            modifiedTime: new Date(12000).toISOString(),
          }), { status: 200 });
        }

        // Multipart PATCH
        if (urlStr.includes('uploadType=multipart') && urlStr.includes('drive_file_abc123')) {
          expect(init?.method).toBe('PATCH');
          return new Response(JSON.stringify(mockUpdatedData), { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
      });

      const result = await googleDriveService.uploadProjectToDrive(projectWithDrive, mockToken);
      expect(result.fileId).toBe('drive_file_abc123');
      expect(result.revisionId).toBe('rev_2');
    });

    it('prevents duplicate files by checking appProperties.projectId during retries', async () => {
      // Project has NO driveFileId yet, but previous attempt created it on Drive
      const projectWithoutId: WhiteboardProject = {
        ...sampleProject,
        driveFileId: undefined,
      };

      const existingDriveFile = {
        id: 'existing_drive_id_999',
        name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
        mimeType: 'application/json',
        appProperties: { app: STUDYCANVAS_APP_ID, projectId: sampleProject.id },
        modifiedTime: new Date(10000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const urlStr = String(url);

        // findFileByProjectId query
        if (urlStr.includes('q=') && urlStr.includes(sampleProject.id)) {
          return new Response(JSON.stringify({ files: [existingDriveFile] }), { status: 200 });
        }

        // File metadata check
        if (urlStr.includes('/files/existing_drive_id_999?') && !urlStr.includes('uploadType=multipart')) {
          return new Response(JSON.stringify(existingDriveFile), { status: 200 });
        }

        // PATCH existing file instead of POST!
        if (urlStr.includes('uploadType=multipart') && urlStr.includes('existing_drive_id_999')) {
          expect(init?.method).toBe('PATCH');
          return new Response(JSON.stringify({
            id: 'existing_drive_id_999',
            name: existingDriveFile.name,
            headRevisionId: 'rev_2',
            modifiedTime: new Date().toISOString(),
          }), { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
      });

      const result = await googleDriveService.uploadProjectToDrive(projectWithoutId, mockToken);
      expect(result.fileId).toBe('existing_drive_id_999');
    });
  });

  describe('4. Safety & Non-Overwrite Safeguards', () => {
    it('refuses to overwrite arbitrary non-StudyCanvas files (e.g. Google Docs)', async () => {
      const maliciousTargetProject: WhiteboardProject = {
        ...sampleProject,
        driveFileId: 'unrelated_google_doc_id',
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('unrelated_google_doc_id')) {
          return new Response(JSON.stringify({
            id: 'unrelated_google_doc_id',
            name: 'Confidential Finance Report.docx',
            mimeType: 'application/vnd.google-apps.document',
            appProperties: {}, // Missing StudyCanvas app property!
          }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      });

      await expect(
        googleDriveService.uploadProjectToDrive(maliciousTargetProject, mockToken)
      ).rejects.toThrow(/was not created by StudyCanvas/i);
    });
  });

  describe('5. Conflict Detection & Revisions', () => {
    it('detects remote concurrent modifications and throws DriveConflictError', async () => {
      const lastSyncedTime = 100000;
      const remoteModifiedTime = new Date(150000).toISOString(); // 50s newer!

      const conflictingProject: WhiteboardProject = {
        ...sampleProject,
        driveFileId: 'drive_file_conflict',
        driveSyncedAt: lastSyncedTime,
        updatedAt: 120000,
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('drive_file_conflict') && !urlStr.includes('uploadType=multipart')) {
          return new Response(JSON.stringify({
            id: 'drive_file_conflict',
            name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
            mimeType: 'application/json',
            appProperties: { app: STUDYCANVAS_APP_ID, projectId: sampleProject.id },
            modifiedTime: remoteModifiedTime,
          }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      });

      await expect(
        googleDriveService.uploadProjectToDrive(conflictingProject, mockToken)
      ).rejects.toThrow(DriveConflictError);
    });

    it('overwrites remote file when forceOverwrite option is true', async () => {
      const lastSyncedTime = 100000;
      const remoteModifiedTime = new Date(150000).toISOString();

      const conflictingProject: WhiteboardProject = {
        ...sampleProject,
        driveFileId: 'drive_file_conflict',
        driveSyncedAt: lastSyncedTime,
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const urlStr = String(url);
        if (urlStr.includes('drive_file_conflict') && !urlStr.includes('uploadType=multipart')) {
          return new Response(JSON.stringify({
            id: 'drive_file_conflict',
            name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
            mimeType: 'application/json',
            appProperties: { app: STUDYCANVAS_APP_ID, projectId: sampleProject.id },
            modifiedTime: remoteModifiedTime,
          }), { status: 200 });
        }

        if (urlStr.includes('uploadType=multipart')) {
          expect(init?.method).toBe('PATCH');
          return new Response(JSON.stringify({
            id: 'drive_file_conflict',
            name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
            headRevisionId: 'rev_forced',
            modifiedTime: new Date().toISOString(),
          }), { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
      });

      const res = await googleDriveService.uploadProjectToDrive(
        conflictingProject, 
        mockToken, 
        { forceOverwrite: true }
      );
      expect(res.fileId).toBe('drive_file_conflict');
      expect(res.revisionId).toBe('rev_forced');
    });
  });

  describe('6. Reopening & Downloading from Drive', () => {
    it('downloads, validates schema, and parses StudyCanvasProjectFile', async () => {
      const fileId = 'drive_download_123';
      const remoteFilePayload = googleDriveService.buildProjectFilePayload(sampleProject);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('alt=media')) {
          return new Response(JSON.stringify(remoteFilePayload), { status: 200 });
        }
        if (urlStr.includes(fileId)) {
          return new Response(JSON.stringify({
            id: fileId,
            name: 'Maxwell Equations & Electromagnetic Waves.studycanvas',
            mimeType: 'application/json',
            webViewLink: 'https://drive.google.com/open?id=' + fileId,
            headRevisionId: 'rev_download',
            modifiedTime: '2026-10-25T14:30:00Z',
            appProperties: { app: STUDYCANVAS_APP_ID },
          }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      });

      const loaded = await googleDriveService.downloadProjectFromDrive(fileId, mockToken);
      expect(loaded.id).toBe('proj_electromagnetism_101');
      expect(loaded.driveFileId).toBe(fileId);
      expect(loaded.driveRevisionId).toBe('rev_download');
      expect(loaded.pages).toHaveLength(1);
      expect(loaded.pages[0].title).toBe('Faraday Law of Induction');
    });

    it('rejects downloading unsupported file types (like Google Docs) as canvas', async () => {
      const fileId = 'docs_unsupported_id';

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes(fileId) && !urlStr.includes('alt=media')) {
          return new Response(JSON.stringify({
            id: fileId,
            name: 'Syllabus.gdoc',
            mimeType: 'application/vnd.google-apps.document',
            appProperties: {},
          }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      });

      await expect(
        googleDriveService.downloadProjectFromDrive(fileId, mockToken)
      ).rejects.toThrow(/Cannot open/i);
    });
  });

  describe('7. Token Expiry, Rate Limits & Error Handling', () => {
    it('detects 401 unauthorized and classifies as expired token', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), { status: 401 })
      );

      try {
        await googleDriveService.uploadProjectToDrive(sampleProject, 'expired_token');
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(DriveApiError);
        expect(err.status).toBe(401);
        expect(err.isTokenExpired).toBe(true);
      }
    });

    it('handles 403 insufficient permissions gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response('The caller does not have permission', { status: 403 });
      });

      await expect(
        googleDriveService.uploadProjectToDrive(sampleProject, mockToken)
      ).rejects.toThrow(/Insufficient permissions/i);
    });

    it('fails when no access token is provided', async () => {
      await expect(
        googleDriveService.uploadProjectToDrive(sampleProject, '')
      ).rejects.toThrow(DriveApiError);
    });
  });

  describe('8. Firestore Metadata Synchronization & Write Confirmations', () => {
    it('updates confirmed Drive references in Firestore and local backup', async () => {
      storage.saveProject(sampleProject);
      expect(storage.getProjects()[0].driveFileId).toBeUndefined();

      await firestoreService.updateDriveSyncMetadata('proj_electromagnetism_101', {
        driveFileId: 'drive_confirmed_id',
        driveWebViewLink: 'https://drive.google.com/file/d/drive_confirmed_id/view',
        driveRevisionId: 'rev_10',
        driveSyncedAt: 99999,
      });

      const updated = storage.getProjects().find(p => p.id === 'proj_electromagnetism_101');
      expect(updated?.driveFileId).toBe('drive_confirmed_id');
      expect(updated?.driveRevisionId).toBe('rev_10');
      expect(updated?.driveSyncedAt).toBe(99999);
      expect(updated?.schemaVersion).toBe('1.0');
    });
  });
});
