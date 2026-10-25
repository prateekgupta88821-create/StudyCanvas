import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseInitialized } from '@/config/firebase';
import { UserProfile, EducatorRole } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'studycanvas_drive_token';

export const authService = {
  /**
   * Signs in with Google using Firebase Auth popup, requesting Drive scope
   */
  async signInWithGoogle(): Promise<{ user: UserProfile; driveAccessToken: string | null }> {
    if (!isFirebaseInitialized || !auth) {
      throw new Error('Firebase credentials are not configured. Please add VITE_FIREBASE_* variables to .env.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const driveAccessToken = credential?.accessToken || null;

    if (driveAccessToken) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, driveAccessToken);
    }

    const fbUser = result.user;
    const userProfile = await this.syncUserProfile(fbUser);

    return { user: userProfile, driveAccessToken };
  },

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    if (auth && isFirebaseInitialized) {
      await fbSignOut(auth);
    }
  },

  /**
   * Gets the stored Drive access token from current session
   */
  getStoredDriveToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  },

  /**
   * Retrieves or initializes Firestore user profile
   */
  async syncUserProfile(fbUser: FirebaseUser, role: EducatorRole = 'teacher'): Promise<UserProfile> {
    const baseProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      role,
      createdAt: Date.now(),
    };

    if (!db || !isFirebaseInitialized) {
      return baseProfile;
    }

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        return snap.data() as UserProfile;
      } else {
        await setDoc(userRef, baseProfile);
        return baseProfile;
      }
    } catch (e) {
      console.warn('Could not sync user profile to Firestore:', e);
      return baseProfile;
    }
  },

  /**
   * Updates user role (teacher, professor, student)
   */
  async updateUserRole(uid: string, role: EducatorRole): Promise<void> {
    if (!db || !isFirebaseInitialized) return;
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { role, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn('Error updating role in Firestore:', e);
    }
  },

  /**
   * Subscribes to Firebase auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    if (!auth || !isFirebaseInitialized) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};
