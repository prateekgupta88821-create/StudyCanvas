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
import { db, isFirebaseInitialized } from '@/config/firebase';
import { WhiteboardProject } from '@/types/whiteboard';
import { storage } from '@/utils/storage';

const COLLECTION_NAME = 'projects';

export const firestoreService = {
  /**
   * Saves or updates a whiteboard project in Cloud Firestore (with local storage backup)
   */
  async saveProject(project: WhiteboardProject): Promise<void> {
    // Always persist to local backup
    storage.saveProject(project);

    if (!db || !isFirebaseInitialized) {
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, project.id);
      await setDoc(docRef, {
        ...project,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving project to Firestore:', error);
      throw error;
    }
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
      callback(storage.getProjects());
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
        callback(storage.getProjects());
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
   * Deletes a project by ID
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
  }
};
