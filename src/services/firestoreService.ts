import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/config/firebase';
import { WhiteboardProject } from '@/types/whiteboard';
import { storage } from '@/utils/storage';

const COLLECTION_NAME = 'projects';

export const firestoreService = {
  /**
   * Saves or updates a whiteboard project in Cloud Firestore (with local storage backup)
   */
  async saveProject(project: WhiteboardProject): Promise<void> {
    // If authenticated user is present, ensure ownerId matches the verified user
    const currentUid = auth?.currentUser?.uid;
    const verifiedProject: WhiteboardProject = {
      ...project,
      ownerId: currentUid || project.ownerId || 'guest',
      updatedAt: Date.now(),
    };

    // Always persist to local backup
    storage.saveProject(verifiedProject);

    if (!db || !isFirebaseInitialized) {
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, verifiedProject.id);
      await setDoc(docRef, verifiedProject, { merge: true });
    } catch (error) {
      console.error('Error saving project to Firestore:', error);
      throw error;
    }
  },

  /**
   * Updates partial metadata on a project (title, subject, description, favorite, trash state)
   */
  async updateProjectMeta(projectId: string, updates: Partial<WhiteboardProject>): Promise<void> {
    const updated = storage.updateProjectMeta(projectId, updates);

    if (!db || !isFirebaseInitialized || !updated) {
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, projectId);
      await setDoc(docRef, { ...updates, updatedAt: Date.now() }, { merge: true });
    } catch (error) {
      console.warn('Error updating project meta in Firestore:', error);
    }
  },

  /**
   * Updates confirmed Google Drive file metadata in Firestore after successful Drive upload
   */
  async updateDriveSyncMetadata(
    projectId: string,
    syncData: {
      driveFileId: string;
      driveWebViewLink?: string;
      driveRevisionId?: string;
      driveSyncedAt: number;
    }
  ): Promise<void> {
    await this.updateProjectMeta(projectId, {
      ...syncData,
      schemaVersion: '1.0',
    });
  },

  /**
   * Toggles the favorite status of a project
   */
  async toggleFavorite(projectId: string, currentFavorite: boolean): Promise<boolean> {
    const nextState = !currentFavorite;
    await this.updateProjectMeta(projectId, { isFavorite: nextState });
    return nextState;
  },

  /**
   * Soft deletes a project into Trash
   */
  async moveToTrash(projectId: string): Promise<void> {
    await this.updateProjectMeta(projectId, { isTrashed: true, trashedAt: Date.now() });
  },

  /**
   * Restores a soft-deleted project from Trash
   */
  async restoreFromTrash(projectId: string): Promise<void> {
    await this.updateProjectMeta(projectId, { isTrashed: false, trashedAt: undefined });
  },

  /**
   * Duplicates an existing project
   */
  async duplicateProject(projectId: string, customTitle?: string): Promise<WhiteboardProject | null> {
    const copied = storage.duplicateProject(projectId, customTitle);
    if (!copied) return null;

    if (db && isFirebaseInitialized) {
      try {
        const docRef = doc(db, COLLECTION_NAME, copied.id);
        await setDoc(docRef, copied);
      } catch (e) {
        console.warn('Could not sync duplicated project to Firestore:', e);
      }
    }
    return copied;
  },

  /**
   * Fetches all projects owned by a specific user
   */
  async getUserProjects(userId: string): Promise<WhiteboardProject[]> {
    if (!db || !isFirebaseInitialized) {
      const local = storage.getProjects();
      return local.filter(p => p.ownerId === userId || !p.ownerId);
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const projects: WhiteboardProject[] = [];
      snapshot.forEach(docSnap => {
        projects.push(docSnap.data() as WhiteboardProject);
      });
      return projects;
    } catch (error) {
      console.warn('Firestore query failed, falling back to local storage:', error);
      return storage.getProjects().filter(p => p.ownerId === userId || !p.ownerId);
    }
  },

  /**
   * Subscribes to real-time updates for a user's projects
   */
  subscribeToUserProjects(userId: string, callback: (projects: WhiteboardProject[]) => void) {
    if (!db || !isFirebaseInitialized) {
      const local = storage.getProjects().filter(p => p.ownerId === userId || !p.ownerId);
      callback(local);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: WhiteboardProject[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as WhiteboardProject);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscription error, using local fallback:', error);
        const local = storage.getProjects().filter(p => p.ownerId === userId || !p.ownerId);
        callback(local);
      }
    );
  },

  /**
   * Gets a single project by ID
   */
  async getProjectById(projectId: string): Promise<WhiteboardProject | null> {
    if (!db || !isFirebaseInitialized) {
      return storage.getProjects().find(p => p.id === projectId) || null;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, projectId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as WhiteboardProject;
      }
      return storage.getProjects().find(p => p.id === projectId) || null;
    } catch (e) {
      console.warn('Firestore getDoc error, checking local storage:', e);
      return storage.getProjects().find(p => p.id === projectId) || null;
    }
  },

  /**
   * Permanently deletes a project by ID
   */
  async deleteProject(projectId: string): Promise<void> {
    storage.deleteProject(projectId);

    if (!db || !isFirebaseInitialized) {
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, projectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting project in Firestore:', error);
      throw error;
    }
  },

  /**
   * Permanently empties all trashed projects for user
   */
  async emptyTrash(userId: string, trashedIds: string[]): Promise<void> {
    storage.emptyTrash(userId);
    if (!db || !isFirebaseInitialized) return;

    try {
      for (const id of trashedIds) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      }
    } catch (e) {
      console.warn('Error emptying trash in Firestore:', e);
    }
  }
};
