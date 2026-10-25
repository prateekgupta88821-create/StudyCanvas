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

export interface AuthErrorInfo {
  code: string;
  message: string;
  isCancelled: boolean;
  isPopupBlocked: boolean;
  isConfigMissing: boolean;
  isRetryable: boolean;
}

/**
 * Maps raw Firebase authentication errors to user-friendly messages and diagnostic tags
 */
export function formatAuthError(error: unknown): AuthErrorInfo {
  if (!error || typeof error !== 'object') {
    return {
      code: 'auth/unknown',
      message: 'An unexpected authentication error occurred. Please try again.',
      isCancelled: false,
      isPopupBlocked: false,
      isConfigMissing: false,
      isRetryable: true,
    };
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || 'auth/unknown';
  const rawMessage = err.message || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return {
        code,
        message: 'Sign-in cancelled. The Google sign-in window was closed before completing.',
        isCancelled: true,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/popup-blocked':
      return {
        code,
        message: 'Sign-in popup was blocked by your browser. Please allow popups for StudyCanvas and try again.',
        isCancelled: false,
        isPopupBlocked: true,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/cancelled-popup-request':
      return {
        code,
        message: 'A previous sign-in request was interrupted. Please click Continue with Google again.',
        isCancelled: true,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/network-request-failed':
      return {
        code,
        message: 'Network connection failed. Please check your internet connection and try again.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/unauthorized-domain':
      return {
        code,
        message: 'This domain is not authorized for Google Sign-In. Add this domain to your Firebase Console under Authentication > Settings > Authorized Domains.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: true,
        isRetryable: false,
      };

    case 'auth/operation-not-allowed':
      return {
        code,
        message: 'Google Sign-In is not enabled. Please enable the Google provider in Firebase Console under Authentication > Sign-in method.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: true,
        isRetryable: false,
      };

    case 'auth/account-exists-with-different-credential':
      return {
        code,
        message: 'An account already exists with the same email using a different sign-in method.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: false,
      };

    case 'auth/user-disabled':
      return {
        code,
        message: 'This user account has been disabled. Please contact your institution administrator.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: false,
      };

    case 'auth/missing-configuration':
      return {
        code,
        message: 'Firebase configuration is missing. Add your VITE_FIREBASE_* keys to .env.local to enable real Google authentication.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: true,
        isRetryable: false,
      };

    default:
      if (rawMessage.includes('configuration') || rawMessage.includes('API key')) {
        return {
          code: 'auth/invalid-api-key',
          message: 'Firebase configuration error: Please verify your Firebase API key in .env.local.',
          isCancelled: false,
          isPopupBlocked: false,
          isConfigMissing: true,
          isRetryable: false,
        };
      }
      return {
        code,
        message: rawMessage || 'Failed to authenticate with Google. Please try again.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };
  }
}

export const authService = {
  /**
   * Checks whether Firebase Auth is properly initialized
   */
  isConfigured(): boolean {
    return Boolean(isFirebaseInitialized && auth);
  },

  /**
   * Signs in with Google using Firebase Auth popup, requesting Google Drive scope
   */
  async signInWithGoogle(): Promise<{ user: UserProfile; driveAccessToken: string | null; firebaseUser: FirebaseUser }> {
    if (!this.isConfigured() || !auth) {
      const err = new Error('Firebase credentials are not configured. Please add VITE_FIREBASE_* variables to .env.local.');
      (err as any).code = 'auth/missing-configuration';
      throw err;
    }

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const driveAccessToken = credential?.accessToken || null;

    if (driveAccessToken) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, driveAccessToken);
    }

    const fbUser = result.user;
    // Derive profile strictly from verified Firebase user token
    const userProfile = await this.syncUserProfile(fbUser);

    return { user: userProfile, driveAccessToken, firebaseUser: fbUser };
  },

  /**
   * Signs out the current user and clears session tokens
   */
  async signOut(): Promise<void> {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('studycanvas_user_profile');
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
   * Retrieves or initializes Firestore user profile.
   * Never trusts client-supplied user IDs; uses authenticated FirebaseUser.uid strictly.
   */
  async syncUserProfile(fbUser: FirebaseUser, role: EducatorRole = 'teacher'): Promise<UserProfile> {
    const baseProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || 'StudyCanvas Educator',
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
        const existingData = snap.data() as UserProfile;
        return {
          ...baseProfile,
          ...existingData,
          displayName: fbUser.displayName || existingData.displayName,
          photoURL: fbUser.photoURL || existingData.photoURL,
          email: fbUser.email || existingData.email,
        };
      } else {
        await setDoc(userRef, baseProfile);
        return baseProfile;
      }
    } catch (e) {
      console.warn('Could not sync user profile to Firestore (using in-memory verified profile):', e);
      return baseProfile;
    }
  },

  /**
   * Updates user role (teacher, professor, student) in Cloud Firestore
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
   * Subscribes to Firebase auth state changes with error handling for expired sessions
   */
  onAuthStateChange(
    onUserChange: (user: FirebaseUser | null) => void,
    onError?: (error: Error) => void
  ) {
    if (!auth || !isFirebaseInitialized) {
      onUserChange(null);
      return () => {};
    }
    return onAuthStateChanged(
      auth,
      (user) => {
        onUserChange(user);
      },
      (error) => {
        console.error('Firebase Auth state error:', error);
        if (onError) onError(error);
        onUserChange(null);
      }
    );
  },

  /**
   * Gets ID token for authenticating backend requests if needed
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  }
};
