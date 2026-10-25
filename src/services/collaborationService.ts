/**
 * StudyCanvas Real-Time Collaboration Service
 *
 * Implements real-time presence indicators, collaborator cursors,
 * role-based sharing & invitation flows, canvas comments, presentation/follow mode,
 * and reliable reconnection handling via Cloud Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/config/firebase';
import {
  Collaborator,
  CollaboratorRole,
  CollaboratorCursor,
  WhiteboardComment,
  CommentReply,
  PresentationFollowState,
} from '@/types/collaboration';

// Local storage key for fallback simulation and offline recovery
const COLLAB_STORAGE_KEY_PREFIX = 'studycanvas_collab_';

class CollaborationService {
  private cursorThrottleTimers: Map<string, number> = new Map();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Invites a new collaborator to a project with a specific role
   */
  async inviteCollaborator(
    projectId: string,
    email: string,
    role: CollaboratorRole,
    displayName = ''
  ): Promise<Collaborator> {
    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

    const newCollaborator: Collaborator = {
      uid: id,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      role,
      status: 'pending',
      invitedAt: Date.now(),
    };

    if (db && isFirebaseInitialized) {
      const collabDoc = doc(db, 'projects', projectId, 'collaborators', id);
      await setDoc(collabDoc, {
        ...newCollaborator,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Local storage fallback for offline / development
      const current = this.getLocalCollaborators(projectId);
      const filtered = current.filter((c) => c.email !== cleanEmail);
      filtered.push(newCollaborator);
      this.saveLocalCollaborators(projectId, filtered);
    }

    return newCollaborator;
  }

  /**
   * Removes a collaborator from the project
   */
  async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    if (db && isFirebaseInitialized) {
      const collabDoc = doc(db, 'projects', projectId, 'collaborators', collaboratorId);
      await deleteDoc(collabDoc);
    } else {
      const current = this.getLocalCollaborators(projectId);
      const filtered = current.filter((c) => c.uid !== collaboratorId);
      this.saveLocalCollaborators(projectId, filtered);
    }
  }

  /**
   * Updates an existing collaborator's role
   */
  async updateCollaboratorRole(
    projectId: string,
    collaboratorId: string,
    newRole: CollaboratorRole
  ): Promise<void> {
    if (db && isFirebaseInitialized) {
      const collabDoc = doc(db, 'projects', projectId, 'collaborators', collaboratorId);
      await setDoc(collabDoc, { role: newRole, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      const current = this.getLocalCollaborators(projectId);
      const target = current.find((c) => c.uid === collaboratorId);
      if (target) {
        target.role = newRole;
        this.saveLocalCollaborators(projectId, current);
      }
    }
  }

  /**
   * Subscribes to real-time changes in project collaborators
   */
  subscribeToCollaborators(
    projectId: string,
    callback: (collaborators: Collaborator[]) => void
  ): Unsubscribe {
    if (!db || !isFirebaseInitialized) {
      const local = this.getLocalCollaborators(projectId);
      callback(local);
      return () => {};
    }

    const collRef = collection(db, 'projects', projectId, 'collaborators');
    return onSnapshot(
      collRef,
      (snapshot) => {
        const list: Collaborator[] = [];
        snapshot.forEach((snap) => {
          list.push(snap.data() as Collaborator);
        });
        callback(list);
      },
      (error) => {
        console.warn('Collaborators subscription error, falling back to local:', error);
        callback(this.getLocalCollaborators(projectId));
      }
    );
  }

  /**
   * Resolves the current user's role on the project
   */
  async resolveUserRole(
    projectId: string,
    ownerId: string,
    currentUserUid?: string,
    currentUserEmail?: string
  ): Promise<CollaboratorRole> {
    if (!currentUserUid) return 'viewer';
    if (currentUserUid === ownerId) return 'owner';

    if (db && isFirebaseInitialized) {
      try {
        // Check by uid first
        const docRefUid = doc(db, 'projects', projectId, 'collaborators', currentUserUid);
        const snapUid = await getDoc(docRefUid);
        if (snapUid.exists()) {
          return snapUid.data().role as CollaboratorRole;
        }

        // Check by email hash
        if (currentUserEmail) {
          const emailId = currentUserEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
          const docRefEmail = doc(db, 'projects', projectId, 'collaborators', emailId);
          const snapEmail = await getDoc(docRefEmail);
          if (snapEmail.exists()) {
            return snapEmail.data().role as CollaboratorRole;
          }
        }
      } catch (err) {
        console.warn('Error resolving user role from Firestore:', err);
      }
    }

    // Check local fallback
    const local = this.getLocalCollaborators(projectId);
    const found = local.find(
      (c) =>
        c.uid === currentUserUid ||
        (currentUserEmail && c.email.toLowerCase() === currentUserEmail.toLowerCase())
    );

    return found ? found.role : 'viewer';
  }

  /**
   * Broadcasts the current user's cursor position (throttled to 50ms)
   */
  broadcastCursor(projectId: string, cursor: CollaboratorCursor): void {
    if (!db || !isFirebaseInitialized || !this.isOnline) return;

    const key = `${projectId}_${cursor.uid}`;
    const now = Date.now();
    const lastSent = this.cursorThrottleTimers.get(key) || 0;

    if (now - lastSent < 50) return; // 50ms throttle (20 updates/sec max)
    this.cursorThrottleTimers.set(key, now);

    try {
      const presenceDoc = doc(db, 'projects', projectId, 'presence', cursor.uid);
      setDoc(presenceDoc, {
        ...cursor,
        lastActive: Date.now(),
      });
    } catch {
      // Ignored for high-frequency cursor updates
    }
  }

  /**
   * Clears cursor on mouse leave or window unload
   */
  async clearCursor(projectId: string, uid: string): Promise<void> {
    if (!db || !isFirebaseInitialized) return;
    try {
      const presenceDoc = doc(db, 'projects', projectId, 'presence', uid);
      await deleteDoc(presenceDoc);
    } catch {
      // Ignored
    }
  }

  /**
   * Subscribes to real-time remote collaborator cursors
   */
  subscribeToCursors(
    projectId: string,
    pageId: string,
    currentUid: string,
    callback: (cursors: CollaboratorCursor[]) => void
  ): Unsubscribe {
    if (!db || !isFirebaseInitialized) {
      callback([]);
      return () => {};
    }

    const presenceCol = collection(db, 'projects', projectId, 'presence');
    return onSnapshot(
      presenceCol,
      (snapshot) => {
        const cursors: CollaboratorCursor[] = [];
        const cutoff = Date.now() - 15000; // Consider offline after 15s of silence

        snapshot.forEach((snap) => {
          const data = snap.data() as CollaboratorCursor;
          if (data.uid !== currentUid && data.pageId === pageId && data.lastActive > cutoff) {
            cursors.push(data);
          }
        });

        callback(cursors);
      },
      () => {
        callback([]);
      }
    );
  }

  /**
   * Adds a new educational comment to the whiteboard
   */
  async addComment(projectId: string, comment: WhiteboardComment): Promise<void> {
    if (db && isFirebaseInitialized) {
      const commentDoc = doc(db, 'projects', projectId, 'comments', comment.id);
      await setDoc(commentDoc, {
        ...comment,
        createdAt: comment.createdAt || Date.now(),
      });
    } else {
      const current = this.getLocalComments(projectId);
      current.push(comment);
      this.saveLocalComments(projectId, current);
    }
  }

  /**
   * Resolves or unresolves a comment thread
   */
  async toggleResolveComment(
    projectId: string,
    commentId: string,
    currentResolved: boolean,
    resolvedBy?: string
  ): Promise<void> {
    const nextState = !currentResolved;
    if (db && isFirebaseInitialized) {
      const commentDoc = doc(db, 'projects', projectId, 'comments', commentId);
      await setDoc(
        commentDoc,
        {
          resolved: nextState,
          resolvedAt: nextState ? Date.now() : null,
          resolvedBy: nextState ? resolvedBy || 'Educator' : null,
        },
        { merge: true }
      );
    } else {
      const current = this.getLocalComments(projectId);
      const target = current.find((c) => c.id === commentId);
      if (target) {
        target.resolved = nextState;
        this.saveLocalComments(projectId, current);
      }
    }
  }

  /**
   * Adds a reply to an existing comment
   */
  async addCommentReply(
    projectId: string,
    commentId: string,
    reply: CommentReply
  ): Promise<void> {
    if (db && isFirebaseInitialized) {
      const commentDoc = doc(db, 'projects', projectId, 'comments', commentId);
      const snap = await getDoc(commentDoc);
      if (snap.exists()) {
        const data = snap.data() as WhiteboardComment;
        const replies = data.replies || [];
        replies.push(reply);
        await setDoc(commentDoc, { replies }, { merge: true });
      }
    } else {
      const current = this.getLocalComments(projectId);
      const target = current.find((c) => c.id === commentId);
      if (target) {
        target.replies = target.replies || [];
        target.replies.push(reply);
        this.saveLocalComments(projectId, current);
      }
    }
  }

  /**
   * Deletes a comment thread
   */
  async deleteComment(projectId: string, commentId: string): Promise<void> {
    if (db && isFirebaseInitialized) {
      const commentDoc = doc(db, 'projects', projectId, 'comments', commentId);
      await deleteDoc(commentDoc);
    } else {
      const current = this.getLocalComments(projectId);
      const filtered = current.filter((c) => c.id !== commentId);
      this.saveLocalComments(projectId, filtered);
    }
  }

  /**
   * Subscribes to real-time comments on a project/page
   */
  subscribeToComments(
    projectId: string,
    pageId: string,
    callback: (comments: WhiteboardComment[]) => void
  ): Unsubscribe {
    if (!db || !isFirebaseInitialized) {
      const local = this.getLocalComments(projectId).filter((c) => c.pageId === pageId);
      callback(local);
      return () => {};
    }

    const collRef = collection(db, 'projects', projectId, 'comments');
    const q = query(collRef, where('pageId', '==', pageId));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: WhiteboardComment[] = [];
        snapshot.forEach((snap) => {
          list.push(snap.data() as WhiteboardComment);
        });
        callback(list);
      },
      () => {
        const local = this.getLocalComments(projectId).filter((c) => c.pageId === pageId);
        callback(local);
      }
    );
  }

  /**
   * Broadcasts presenter state (viewport position, zoom, and active page)
   */
  async broadcastPresentationState(
    projectId: string,
    state: PresentationFollowState
  ): Promise<void> {
    if (!db || !isFirebaseInitialized) return;
    try {
      const docRef = doc(db, 'projects', projectId, 'presentation', 'active_session');
      await setDoc(docRef, state);
    } catch {
      // Ignored
    }
  }

  /**
   * Subscribes to presentation follow state
   */
  subscribeToPresentationState(
    projectId: string,
    callback: (state: PresentationFollowState | null) => void
  ): Unsubscribe {
    if (!db || !isFirebaseInitialized) {
      callback(null);
      return () => {};
    }

    const docRef = doc(db, 'projects', projectId, 'presentation', 'active_session');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as PresentationFollowState);
        } else {
          callback(null);
        }
      },
      () => {
        callback(null);
      }
    );
  }

  /**
   * Stops active presentation session
   */
  async stopPresentation(projectId: string): Promise<void> {
    if (!db || !isFirebaseInitialized) return;
    try {
      const docRef = doc(db, 'projects', projectId, 'presentation', 'active_session');
      await deleteDoc(docRef);
    } catch {
      // Ignored
    }
  }

  // --- Helpers for local / offline fallback storage ---
  private getLocalCollaborators(projectId: string): Collaborator[] {
    try {
      const raw = localStorage.getItem(`${COLLAB_STORAGE_KEY_PREFIX}members_${projectId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalCollaborators(projectId: string, list: Collaborator[]) {
    try {
      localStorage.setItem(
        `${COLLAB_STORAGE_KEY_PREFIX}members_${projectId}`,
        JSON.stringify(list)
      );
    } catch {
      // Ignore quota
    }
  }

  private getLocalComments(projectId: string): WhiteboardComment[] {
    try {
      const raw = localStorage.getItem(`${COLLAB_STORAGE_KEY_PREFIX}comments_${projectId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalComments(projectId: string, list: WhiteboardComment[]) {
    try {
      localStorage.setItem(
        `${COLLAB_STORAGE_KEY_PREFIX}comments_${projectId}`,
        JSON.stringify(list)
      );
    } catch {
      // Ignore quota
    }
  }
}

export const collaborationService = new CollaborationService();
