import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PersistenceService 
} from '@/services/persistenceService';
import { firestoreService } from '@/services/firestoreService';
import { 
  googleDriveService, 
  DriveApiError, 
  DriveConflictError 
} from '@/services/googleDriveService';
import { WhiteboardProject } from '@/types/whiteboard';
import { ConflictInfo, PersistenceState } from '@/types/persistence';
import { assetStorageService } from '@/services/assetStorageService';

// Memory storage mock for localStorage
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).localStorage = new MemoryStorage();

// Mock window and EventTarget for node test environment
class MockEventTarget {
  private listeners = new Map<string, Set<(e: any) => void>>();

  addEventListener(type: string, listener: (e: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (e: any) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: any): boolean {
    const set = this.listeners.get(event.type);
    if (set) {
      for (const l of set) {
        l(event);
      }
    }
    return !event.defaultPrevented;
  }
}

const mockWindow = new MockEventTarget();
(globalThis as any).window = mockWindow;

if (typeof (globalThis as any).Event === 'undefined') {
  (globalThis as any).Event = class {
    defaultPrevented = false;
    constructor(public type: string) {}
    preventDefault() { this.defaultPrevented = true; }
  };
}

describe('StudyCanvas Reliable Persistence & Recovery Architecture', () => {
  let service: PersistenceService;

  const sampleProject: WhiteboardProject = {
    id: 'proj_relativity_calc_101',
    title: 'General Relativity & Space Curvature',
    subject: 'Physics',
    tags: ['lecture', 'relativity'],
    ownerId: 'user_einstein',
    createdAt: 100000,
    updatedAt: 100000,
    version: 1,
    activePageIndex: 0,
    pages: [
      {
        id: 'page_1',
        title: 'Geodesics on Lorentzian Manifolds',
        backgroundColor: '#090b0e',
        gridType: 'dots',
        elements: [
          {
            id: 'elem_pen_1',
            type: 'pen',
            x: 10,
            y: 10,
            points: [10, 10, 15, 15, 20, 20],
            color: '#a3e635',
            size: 3,
            strokeWidth: 3,
            opacity: 1,
            createdAt: 100000,
            updatedAt: 100000,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    service = new PersistenceService();
    // Fast debounce and retries for tests
    service.configure({
      debounceMs: 200,
      baseRetryDelayMs: 50,
      maxRetryDelayMs: 200,
      maxRetries: 3,
    });
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  describe('1. Configurable Debounce & Rapid Consecutive Edits', () => {
    it('debounces rapid consecutive drawing edits and executes a single save', async () => {
      const saveSpy = vi.spyOn(firestoreService, 'saveProject').mockResolvedValue();

      service.setActiveProject(sampleProject);

      // Simulate 10 rapid pen strokes within the debounce window
      for (let i = 1; i <= 10; i++) {
        const edited: WhiteboardProject = {
          ...sampleProject,
          title: `Stroke ${i}`,
          updatedAt: 100000 + i * 10,
        };
        service.markDirty(edited);
        vi.advanceTimersByTime(50); // Less than the 200ms debounce
      }

      // No network request sent yet during rapid drawing
      expect(saveSpy).not.toHaveBeenCalled();

      // Advance past debounce timer
      await vi.advanceTimersByTimeAsync(250);

      // Verify exactly ONE save occurred with the latest state
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Stroke 10',
          version: 2,
        })
      );
    });
  });

  describe('2. Dirty-State Tracking & Non-Blocking Interactions', () => {
    it('does not send unnecessary writes when document is clean', async () => {
      const saveSpy = vi.spyOn(firestoreService, 'saveProject').mockResolvedValue();

      service.setActiveProject(sampleProject);

      // Attempt flush when clean
      await service.flushNow();

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('immediately saves a lightweight recovery draft in localStorage upon dirtying', () => {
      service.setActiveProject(sampleProject);
      service.markDirty({
        ...sampleProject,
        title: 'Draft in Progress',
      });

      const draft = service.getRecoveryDraft(sampleProject.id);
      expect(draft).not.toBeNull();
      expect(draft?.project.title).toBe('Draft in Progress');
      expect(draft?.isRecoveryDraft).toBe(true);
    });
  });

  describe('3. In-Flight Mutex & Write Serialization', () => {
    it('serializes writes to prevent stale content from overwriting newer content', async () => {
      const savesOrder: string[] = [];
      let resolveFirstSave: () => void = () => {};

      vi.spyOn(firestoreService, 'saveProject').mockImplementation((proj: WhiteboardProject) => {
        savesOrder.push(proj.title);
        if (proj.title === 'Save 1') {
          return new Promise<void>((resolve) => {
            resolveFirstSave = resolve;
          });
        }
        return Promise.resolve();
      });

      service.setActiveProject(sampleProject);

      // Trigger first write
      service.markDirty({ ...sampleProject, title: 'Save 1' });
      const firstFlush = service.flushNow();
      await Promise.resolve(); // Allow synchronous dispatch of first promise

      // Trigger newer write while first write is still traversing the network
      service.markDirty({ ...sampleProject, title: 'Save 2 (Newest Drawing)' });
      const secondFlush = service.flushNow();
      await Promise.resolve();

      // First save is in-flight
      expect(savesOrder).toEqual(['Save 1']);

      // Complete the first save
      resolveFirstSave();
      await firstFlush;
      await secondFlush;

      // Both executed sequentially in strict timestamp order
      expect(savesOrder).toEqual(['Save 1', 'Save 2 (Newest Drawing)']);
    });
  });

  describe('4. Bounded Exponential Backoff & Transient Retry', () => {
    it('retries transient failures with exponential backoff and succeeds', async () => {
      let attempts = 0;
      vi.spyOn(firestoreService, 'saveProject').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Transient 503 Service Unavailable'));
        }
        return Promise.resolve();
      });

      const states: string[] = [];
      service.subscribe({
        onStatusChange: (s: PersistenceState) => {
          states.push(s.status);
        },
      });

      service.setActiveProject(sampleProject);
      service.markDirty({ ...sampleProject, title: 'Retry Test' });

      const flushPromise = service.flushNow();

      // Advance through retry backoffs: 50ms, then 100ms
      await vi.advanceTimersByTimeAsync(350);
      await flushPromise;

      expect(attempts).toBe(3);
      expect(states).toContain('saving');
      expect(states).toContain('saved');
    });

    it('marks error status when maximum retries are exceeded but preserves recovery draft', async () => {
      vi.spyOn(firestoreService, 'saveProject').mockRejectedValue(new Error('Persistent Database Down'));

      let finalStatus = '';
      service.subscribe({
        onStatusChange: (s: PersistenceState) => {
          finalStatus = s.status;
        },
      });

      service.setActiveProject(sampleProject);
      service.markDirty({ ...sampleProject, title: 'Critical Lecture' });

      const flushPromise = service.flushNow();
      await vi.advanceTimersByTimeAsync(1500);
      await flushPromise;

      expect(finalStatus).toBe('error');

      // Crucial: Drawing was NOT lost! Still in recovery cache
      const draft = service.getRecoveryDraft(sampleProject.id);
      expect(draft?.project.title).toBe('Critical Lecture');
    });
  });

  describe('5. Navigation Guard & Emergency Recovery Snapshot (beforeunload)', () => {
    it('synchronously saves recovery snapshot and sets warning on beforeunload when dirty', () => {
      service.setActiveProject(sampleProject);
      service.markDirty({
        ...sampleProject,
        title: 'Unsaved Sketch Before Closing Tab',
      });

      const event = new (globalThis as any).Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      let returnValue: string | undefined;
      Object.defineProperty(event, 'returnValue', {
        get: () => returnValue,
        set: (v) => { returnValue = v; },
      });

      mockWindow.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(returnValue).toContain('unsaved changes');

      // Verify recovery draft is immediately present
      const recovery = service.getRecoveryDraft(sampleProject.id);
      expect(recovery?.project.title).toBe('Unsaved Sketch Before Closing Tab');
    });
  });

  describe('6. Recovery of Unsaved Work After Network Failure or Refresh', () => {
    it('detects newer recovery draft and checks hasNewerRecovery', () => {
      const baseProject: WhiteboardProject = {
        ...sampleProject,
        updatedAt: 100000,
      };

      service.setActiveProject(baseProject);

      // No recovery yet
      expect(service.hasNewerRecovery(baseProject)).toBe(false);

      // Mark dirty creates recovery draft with savedAt > baseProject.updatedAt + 2000
      vi.setSystemTime(105000);
      service.markDirty({
        ...baseProject,
        title: 'Recovered After Crash',
      });

      expect(service.hasNewerRecovery(baseProject)).toBe(true);

      const draft = service.getRecoveryDraft(baseProject.id);
      expect(draft?.project.title).toBe('Recovered After Crash');

      // Discarding or cloud-saving cleans up the draft
      service.clearRecoveryDraft(baseProject.id);
      expect(service.getRecoveryDraft(baseProject.id)).toBeNull();
    });
  });

  describe('7. Offline Edits & Automatic Reconnect Resumption', () => {
    it('transitions to offline status without losing edits, then flushes when back online', async () => {
      const saveSpy = vi.spyOn(firestoreService, 'saveProject').mockResolvedValue();

      // Simulate offline environment
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      let currentStatus = '';
      service.subscribe({
        onStatusChange: (s) => { currentStatus = s.status; },
      });

      service.setActiveProject(sampleProject);
      service.markDirty({ ...sampleProject, title: 'Offline Formula' });

      await service.flushNow();

      expect(currentStatus).toBe('offline');
      expect(saveSpy).not.toHaveBeenCalled();

      // Back online!
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockWindow.dispatchEvent(new (globalThis as any).Event('online'));

      await vi.advanceTimersByTimeAsync(250);

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(currentStatus).toBe('saved');
    });
  });

  describe('8. Expired Authorization (401) & Safe Reauthentication', () => {
    it('handles Google Drive 401 token expiry without losing data and alerts onAuthExpired', async () => {
      vi.spyOn(googleDriveService, 'uploadProjectToDrive').mockRejectedValue(
        new DriveApiError('The access token has expired or is invalid.', 401, 'drive/token-expired')
      );

      let authExpiredTriggered = false;
      let status = '';

      service.subscribe({
        onStatusChange: (s) => { status = s.status; },
        onAuthExpired: () => { authExpiredTriggered = true; },
      });

      service.setActiveProject(sampleProject);

      await expect(
        service.syncToDrive(sampleProject, 'expired_token_123')
      ).rejects.toThrow();

      expect(status).toBe('auth_expired');
      expect(authExpiredTriggered).toBe(true);

      // Data is safe in local storage
      service.saveRecoveryDraft(sampleProject);
      expect(service.getRecoveryDraft(sampleProject.id)).not.toBeNull();
    });
  });

  describe('9. Conflict Detection for Multi-Tab & Google Drive Concurrency', () => {
    it('triggers onConflict when Google Drive detects a concurrent remote revision', async () => {
      vi.spyOn(googleDriveService, 'uploadProjectToDrive').mockRejectedValue(
        new DriveConflictError(
          'File was modified in Google Drive.',
          {
            localProject: sampleProject,
            localModifiedTime: sampleProject.updatedAt,
            remoteModifiedTime: '2026-10-25T20:00:00Z',
            remoteFile: { id: 'file_remote_1', name: 'File 1', mimeType: 'application/json' },
          }
        )
      );

      let receivedConflict: ConflictInfo | null = null;
      service.subscribe({
        onConflict: (c) => { receivedConflict = c; },
      });

      service.setActiveProject(sampleProject);

      await expect(
        service.syncToDrive(sampleProject, 'valid_token_123')
      ).rejects.toThrow();

      expect(receivedConflict).not.toBeNull();
      const conflict: ConflictInfo = receivedConflict!;
      expect(conflict.source).toBe('google_drive');
      expect(conflict.remoteModifiedTime).toBe('2026-10-25T20:00:00Z');
    });

    it('triggers onConflict when another browser tab saves the same project while current tab has unsaved edits', () => {
      let conflictReceived: ConflictInfo | null = null;
      service.subscribe({
        onConflict: (c) => { conflictReceived = c; },
      });

      service.setActiveProject(sampleProject);

      // Current tab makes an edit
      service.markDirty({
        ...sampleProject,
        title: 'Local Tab Edits',
      });

      // Simulate BroadcastChannel message arriving from Tab 2
      (service as any).handleCrossTabMessage({
        type: 'PROJECT_SAVED',
        projectId: sampleProject.id,
        version: 5,
        updatedAt: 150000,
        tabId: 'tab_other_session_999',
      });

      expect(conflictReceived).not.toBeNull();
      const conflict: ConflictInfo = conflictReceived!;
      expect(conflict.source).toBe('tab_concurrency');
      expect(conflict.remoteModifiedTime).toBe(150000);
    });
  });

  describe('10. Safe Schema Migration on Recovery & Project Load', () => {
    it('safely migrates and validates older recovery drafts with missing fields', () => {
      const legacyRawDraft = {
        projectId: 'legacy_proj_1',
        savedAt: Date.now(),
        isRecoveryDraft: true,
        changeCount: 3,
        project: {
          id: 'legacy_proj_1',
          title: 'Legacy Whiteboard V1',
          // pages without gridType, schemaVersion missing
          pages: [
            {
              id: 'p1',
              title: 'Slide 1',
              elements: [
                {
                  id: 'el_legacy',
                  type: 'pen',
                  x: 0,
                  y: 0,
                  points: [0, 0, 10, 10],
                },
              ],
            },
          ],
        },
      };

      localStorage.setItem('studycanvas_recovery_legacy_proj_1', JSON.stringify(legacyRawDraft));

      const recovered = service.getRecoveryDraft('legacy_proj_1');
      expect(recovered).not.toBeNull();
      expect(recovered?.project.schemaVersion).toBe('2.0.0');
      expect(recovered?.project.pages[0].gridType).toBe('dots');
      expect(recovered?.project.pages[0].backgroundColor).toBe('#090b0e');
    });
  });

  describe('11. Asset Externalization & Payload Optimization', () => {
    it('extracts large image assets into manifest keeping document payloads lightweight', () => {
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(40000); // 40KB payload
      const projectWithImage: WhiteboardProject = {
        ...sampleProject,
        pages: [
          {
            ...sampleProject.pages[0],
            elements: [
              {
                id: 'img_test_1',
                type: 'image',
                x: 0,
                y: 0,
                src: largeBase64,
                width: 800,
                height: 600,
                naturalWidth: 800,
                naturalHeight: 600,
                createdAt: 100000,
                updatedAt: 100000,
              },
            ],
          },
        ],
      };

      const payload = googleDriveService.buildProjectFilePayload(projectWithImage);
      expect(payload.assetsManifest).toBeDefined();
      const firstPageImg = payload.project.pages[0].elements[0] as any;
      // In document payload, src is replaced by asset:// URI
      expect(firstPageImg.src).toContain('asset://');

      // Hydration restores original dataUrl
      const hydrated = assetStorageService.hydrateProject(payload.project, payload.assetsManifest);
      const hydratedImg = hydrated.pages[0].elements[0] as any;
      expect(hydratedImg.src).toBe(largeBase64);
    });
  });

  describe('12. Google Drive Revision History & Rollback Recovery', () => {
    it('lists revisions and restores an earlier project revision', async () => {
      const mockRevisions = [
        { id: 'rev_2_latest', modifiedTime: '2026-10-25T20:30:00Z', keepForever: false, size: 4096 },
        { id: 'rev_1_old', modifiedTime: '2026-10-25T18:00:00Z', keepForever: true, size: 2048 },
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementation((url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/revisions?')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ revisions: mockRevisions }),
          } as Response);
        }
        if (urlStr.includes('/revisions/rev_1_old?alt=media')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              format: 'studycanvas',
              project: { ...sampleProject, title: 'Historical Version 1' },
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'file_test_123', name: 'proj.studycanvas' }),
        } as Response);
      });

      const list = await googleDriveService.listFileRevisions('file_test_123', 'token_xyz');
      expect(list.length).toBe(2);
      expect(list[0].id).toBe('rev_2_latest');

      const restored = await googleDriveService.restoreFileRevision('file_test_123', 'rev_1_old', 'token_xyz');
      expect(restored.title).toBe('Historical Version 1');
      expect(restored.driveRevisionId).toBe('rev_1_old');
    });
  });
});
