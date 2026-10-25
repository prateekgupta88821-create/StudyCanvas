import { WhiteboardProject } from '@/types/whiteboard';
import { 
  SaveStatus, 
  RecoveryDraft, 
  PersistenceConfig, 
  PersistenceState, 
  ConflictInfo 
} from '@/types/persistence';
import { firestoreService } from './firestoreService';
import { googleDriveService, DriveApiError, DriveConflictError } from './googleDriveService';
import { migrateProject } from './schemaMigration';
import { assetStorageService } from './assetStorageService';

const RECOVERY_STORAGE_PREFIX = 'studycanvas_recovery_';
const CHANNEL_NAME = 'studycanvas_project_sync_channel';

// Unique session/tab identifier to distinguish multi-tab edits
export const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);

export interface PersistenceListener {
  onStatusChange?: (state: PersistenceState) => void;
  onConflict?: (conflict: ConflictInfo) => void;
  onAuthExpired?: () => void;
}

export class PersistenceService {
  private config: PersistenceConfig = {
    debounceMs: 1500,
    maxRetries: 4,
    baseRetryDelayMs: 1000,
    maxRetryDelayMs: 10000,
  };

  private state: PersistenceState = {
    status: 'idle',
    lastSavedAt: null,
    isDirty: false,
    error: null,
    pendingWritesCount: 0,
  };

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingProject: WhiteboardProject | null = null;
  private inFlightPromise: Promise<void> | null = null;
  private listeners: Set<PersistenceListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private activeProjectId: string | null = null;
  private changeCounter = 0;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

  constructor() {
    this.initBroadcastChannel();
    this.initNetworkListeners();
    this.initBeforeUnload();
  }

  /**
   * Updates persistence debounce timing and retry settings
   */
  configure(customConfig: Partial<PersistenceConfig>) {
    this.config = { ...this.config, ...customConfig };
  }

  /**
   * Registers a state listener
   */
  subscribe(listener: PersistenceListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener.onStatusChange?.(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState(partial: Partial<PersistenceState>) {
    this.state = { ...this.state, ...partial };
    for (const l of this.listeners) {
      try {
        l.onStatusChange?.(this.state);
      } catch (err) {
        console.warn('Persistence listener error:', err);
      }
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleCrossTabMessage(event.data);
        };
      } catch {
        this.broadcastChannel = null;
      }
    }
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this.state.status === 'offline') {
        this.notifyState({ status: 'idle', error: null });
        if (this.state.isDirty && this.pendingProject) {
          this.flushNow();
        }
      }
    });

    window.addEventListener('offline', () => {
      this.notifyState({ status: 'offline', error: 'No internet connection. Changes saved locally in recovery cache.' });
    });
  }

  private initBeforeUnload() {
    if (typeof window === 'undefined') return;

    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (this.state.isDirty && this.pendingProject) {
        // Save emergency local recovery snapshot synchronously
        this.saveRecoveryDraft(this.pendingProject);

        e.preventDefault();
        e.returnValue = 'You have unsaved changes on your StudyCanvas whiteboard. Leave anyway?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * Sets the active project context and checks for recovery drafts
   */
  setActiveProject(project: WhiteboardProject) {
    this.activeProjectId = project.id;
    this.pendingProject = project;
    this.changeCounter = 0;
    this.state = {
      status: 'saved',
      lastSavedAt: project.updatedAt || Date.now(),
      isDirty: false,
      error: null,
      pendingWritesCount: 0,
    };
    this.notifyState(this.state);
  }

  /**
   * Marks document as dirty when user edits without immediately serializing or sending network requests.
   * Debounces the actual cloud & storage write.
   */
  markDirty(project: WhiteboardProject) {
    this.pendingProject = project;
    this.activeProjectId = project.id;
    this.changeCounter++;

    // Immediately save a lightweight recovery draft locally without blocking UI
    this.saveRecoveryDraft(project);

    this.notifyState({
      isDirty: true,
      pendingWritesCount: this.state.pendingWritesCount + 1,
      status: this.state.status === 'saving' ? 'saving' : 'idle',
    });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushNow();
    }, this.config.debounceMs);
  }

  /**
   * Immediately flushes any pending writes to cloud / persistence queue
   */
  async flushNow(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.pendingProject || !this.state.isDirty) {
      return;
    }

    const projectToSave = {
      ...this.pendingProject,
      version: (this.pendingProject.version || 1) + 1,
      updatedAt: Date.now(),
    };

    // Queue write sequentially ensuring NO overlapping requests
    return this.enqueueWrite(projectToSave);
  }

  /**
   * Serializes writes so only ONE save runs at a time.
   * If newer changes arrive while a save is in-flight, they will be saved sequentially after.
   */
  private async enqueueWrite(project: WhiteboardProject): Promise<void> {
    if (this.inFlightPromise) {
      // Another write is in progress. Wait for it to finish then flush pending
      try {
        await this.inFlightPromise;
      } catch {
        // Ignored; retries handled within writeTask
      }
      return this.flushNow();
    }

    this.inFlightPromise = this.executeSaveWithRetry(project);
    try {
      await this.inFlightPromise;
    } finally {
      this.inFlightPromise = null;
    }
  }

  /**
   * Executes save with bounded exponential backoff
   */
  private async executeSaveWithRetry(project: WhiteboardProject): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.notifyState({
        status: 'offline',
        error: 'Offline. Edits safely stored in local recovery cache.',
      });
      return;
    }

    this.notifyState({
      status: 'saving',
      error: null,
    });

    let attempt = 0;
    let delay = this.config.baseRetryDelayMs;
    const currentSaveCounter = this.changeCounter;

    while (attempt <= this.config.maxRetries) {
      try {
        // 1. Save to Cloud Firestore
        await firestoreService.saveProject(project);

        // 2. Broadcast to other tabs to notify of clean save
        this.broadcastSave(project);

        // 3. Clear dirty state and delete local recovery draft upon successful cloud persistence
        // only if no newer changes occurred while save was in-flight
        const hasNewerEdits = this.changeCounter > currentSaveCounter;
        if (!hasNewerEdits) {
          this.clearRecoveryDraft(project.id);
        }

        this.notifyState({
          status: 'saved',
          lastSavedAt: Date.now(),
          isDirty: hasNewerEdits,
          error: null,
          pendingWritesCount: hasNewerEdits ? 1 : 0,
        });
        return;
      } catch (err: any) {
        attempt++;

        // Conflict detection: If error is DriveConflictError
        if (err instanceof DriveConflictError || err?.code === 'drive/conflict') {
          this.notifyState({
            status: 'conflict',
            error: 'Project was modified in Google Drive from another session.',
          });
          for (const l of this.listeners) {
            l.onConflict?.({
              projectId: project.id,
              localTitle: project.title,
              localModifiedTime: project.updatedAt,
              remoteModifiedTime: err.conflictDetails?.remoteModifiedTime || Date.now(),
              remoteFile: err.conflictDetails?.remoteFile,
              source: 'google_drive',
            });
          }
          return;
        }

        // Auth expired: Token expired (401)
        if (err instanceof DriveApiError && err.isTokenExpired) {
          this.notifyState({
            status: 'auth_expired',
            error: 'Google authentication expired. Changes are safe locally.',
          });
          for (const l of this.listeners) {
            l.onAuthExpired?.();
          }
          return;
        }

        // If maximum retries exceeded, stop and mark error
        if (attempt > this.config.maxRetries) {
          this.notifyState({
            status: 'error',
            error: err.message || 'Auto-save failed. Your drawing is preserved in local recovery.',
          });
          return;
        }

        // Wait with bounded exponential backoff before next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, this.config.maxRetryDelayMs);
      }
    }
  }

  /**
   * Syncs confirmed project to Google Drive with conflict check and token validation
   */
  async syncToDrive(
    project: WhiteboardProject,
    accessToken: string,
    options: { forceOverwrite?: boolean } = {}
  ) {
    if (!accessToken) {
      this.notifyState({ status: 'auth_expired', error: 'Google Drive access token missing.' });
      for (const l of this.listeners) {
        l.onAuthExpired?.();
      }
      throw new DriveApiError('Access token required for Google Drive sync.', 401, 'drive/token-missing');
    }

    this.notifyState({ status: 'saving', error: null });

    try {
      const res = await googleDriveService.uploadProjectToDrive(project, accessToken, options);

      const updatedProject: WhiteboardProject = {
        ...project,
        driveFileId: res.fileId,
        driveWebViewLink: res.webViewLink,
        driveRevisionId: res.revisionId,
        driveSyncedAt: res.syncedAt,
        updatedAt: Date.now(),
      };

      await firestoreService.saveProject(updatedProject);
      this.clearRecoveryDraft(project.id);

      this.notifyState({
        status: 'saved',
        lastSavedAt: Date.now(),
        isDirty: false,
        error: null,
      });

      this.broadcastSave(updatedProject);
      return res;
    } catch (err: any) {
      if (err instanceof DriveConflictError) {
        this.notifyState({ status: 'conflict', error: err.message });
        for (const l of this.listeners) {
          l.onConflict?.({
            projectId: project.id,
            localTitle: project.title,
            localModifiedTime: project.updatedAt,
            remoteModifiedTime: err.conflictDetails?.remoteModifiedTime || Date.now(),
            remoteFile: err.conflictDetails?.remoteFile,
            source: 'google_drive',
          });
        }
      } else if (err instanceof DriveApiError && err.isTokenExpired) {
        this.notifyState({ status: 'auth_expired', error: 'Drive token expired.' });
        for (const l of this.listeners) {
          l.onAuthExpired?.();
        }
      } else {
        this.notifyState({ status: 'error', error: err.message || 'Drive sync failed.' });
      }
      throw err;
    }
  }

  // --- Local Recovery Management (Distinct from Cloud-Saved Truth) ---

  /**
   * Saves an unsaved recovery draft to local storage specifically marked as recovery data
   */
  saveRecoveryDraft(project: WhiteboardProject): void {
    if (typeof localStorage === 'undefined') return;

    try {
      // Create lightweight snapshot with externalized heavy image assets
      const compact = assetStorageService.createLightweightSnapshot(project);

      const draft: RecoveryDraft = {
        projectId: project.id,
        project: compact,
        savedAt: Date.now(),
        parentRevisionId: project.driveRevisionId,
        isRecoveryDraft: true,
        changeCount: this.changeCounter,
      };
      localStorage.setItem(`${RECOVERY_STORAGE_PREFIX}${project.id}`, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save local recovery snapshot:', e);
    }
  }

  /**
   * Checks if an unsaved recovery draft exists for a given project that is newer than the saved project
   */
  getRecoveryDraft(projectId: string): RecoveryDraft | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const raw = localStorage.getItem(`${RECOVERY_STORAGE_PREFIX}${projectId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isRecoveryDraft && parsed.project) {
        // Validate / migrate recovered project and rehydrate image assets
        const migrated = migrateProject(parsed.project);
        parsed.project = assetStorageService.hydrateProject(migrated);
        return parsed as RecoveryDraft;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether the recovery draft has unsaved changes newer than the loaded project
   */
  hasNewerRecovery(project: WhiteboardProject): boolean {
    const draft = this.getRecoveryDraft(project.id);
    if (!draft) return false;

    const draftTime = draft.savedAt;
    const projectTime = project.updatedAt || 0;

    // Has recovery if saved at least 2 seconds after the project's official updatedAt
    return draftTime > projectTime + 2000 && draft.changeCount > 0;
  }

  /**
   * Cleans up local recovery draft after confirmed cloud save or user discard
   */
  clearRecoveryDraft(projectId: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(`${RECOVERY_STORAGE_PREFIX}${projectId}`);
    } catch {
      // Ignored
    }
  }

  // --- Cross-Tab Sync & Multi-Device Conflict Detection ---

  private broadcastSave(project: WhiteboardProject) {
    if (!this.broadcastChannel) return;
    try {
      this.broadcastChannel.postMessage({
        type: 'PROJECT_SAVED',
        projectId: project.id,
        version: project.version,
        updatedAt: project.updatedAt,
        tabId: TAB_ID,
      });
    } catch {
      // Ignored
    }
  }

  private handleCrossTabMessage(data: any) {
    if (!data || data.tabId === TAB_ID) return;

    if (data.type === 'PROJECT_SAVED' && data.projectId === this.activeProjectId) {
      // Another tab saved this same project!
      if (this.state.isDirty) {
        // We also have unsaved local edits in this tab -> CONFLICT!
        this.notifyState({ status: 'conflict', error: 'Another tab edited and saved this whiteboard.' });
        for (const l of this.listeners) {
          l.onConflict?.({
            projectId: data.projectId,
            localTitle: this.pendingProject?.title || 'Current Whiteboard',
            localModifiedTime: this.pendingProject?.updatedAt || Date.now(),
            remoteModifiedTime: data.updatedAt,
            source: 'tab_concurrency',
          });
        }
      }
    }
  }

  /**
   * Clean up listeners when component unmounts
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.listeners.clear();
  }
}

export const persistenceService = new PersistenceService();
