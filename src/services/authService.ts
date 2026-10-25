import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signOut as fbSignOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/config/firebase';
import { UserProfile, EducatorRole } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'studycanvas_drive_token';
const GUEST_STORAGE_KEY = 'studycanvas_guest_session';

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
    case 'auth/email-already-in-use':
      return {
        code,
        message: 'This email is already registered. Please sign in instead.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: false,
      };

    case 'auth/invalid-email':
      return {
        code,
        message: 'The email address is invalid. Please check the spelling and try again.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/weak-password':
      return {
        code,
        message: 'Password is too weak. Please use at least 6 characters.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/user-not-found':
      return {
        code,
        message: 'No account found with this email. Please check your email or create a new account.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: false,
      };

    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        code,
        message: 'Invalid email or password. Please verify your credentials and try again.',
        isCancelled: false,
        isPopupBlocked: false,
        isConfigMissing: false,
        isRetryable: true,
      };

    case 'auth/too-many-requests':
      return {
        code,
        message: 'Too many unsuccessful attempts. Access is temporarily paused for security. Please try again in a few minutes.',
        isCancelled: false,
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
        message: 'Firebase configuration is missing. Add your VITE_FIREBASE_* keys to .env.local to enable cloud accounts, or continue as a guest.',
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
        message: rawMessage || 'Failed to authenticate. Please check your credentials and try again.',
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
   * Signs in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
    if (!this.isConfigured() || !auth) {
      const err = new Error('Firebase credentials are not configured. Please add VITE_FIREBASE_* variables to .env.local.');
      (err as any).code = 'auth/missing-configuration';
      throw err;
    }

    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = credential.user;
    const userProfile = await this.syncUserProfile(fbUser);
    localStorage.removeItem(GUEST_STORAGE_KEY);

    return { user: userProfile, firebaseUser: fbUser };
  },

  /**
   * Registers a new account with email and password
   */
  async signUpWithEmail(
    email: string, 
    password: string, 
    displayName?: string, 
    role: EducatorRole = 'teacher'
  ): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
    if (!this.isConfigured() || !auth) {
      const err = new Error('Firebase credentials are not configured. Please add VITE_FIREBASE_* variables to .env.local.');
      (err as any).code = 'auth/missing-configuration';
      throw err;
    }

    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = credential.user;

    const formattedName = displayName?.trim() || email.split('@')[0] || 'StudyCanvas Educator';
    try {
      await updateProfile(fbUser, { displayName: formattedName });
    } catch {
      // Profile update non-fatal
    }

    const userProfile = await this.syncUserProfile(fbUser, role);
    userProfile.displayName = formattedName;
    localStorage.removeItem(GUEST_STORAGE_KEY);

    return { user: userProfile, firebaseUser: fbUser };
  },

  /**
   * Signs in as a guest (via Firebase Anonymous Auth if available, or local guest session)
   */
  async signInAsGuest(
    displayName = 'Guest Educator', 
    role: EducatorRole = 'teacher'
  ): Promise<{ user: UserProfile; firebaseUser: FirebaseUser | null }> {
    if (this.isConfigured() && auth) {
      try {
        const credential = await signInAnonymously(auth);
        const fbUser = credential.user;
        const profile = await this.syncUserProfile(fbUser, role);
        profile.displayName = displayName;
        profile.isGuest = true;
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
        return { user: profile, firebaseUser: fbUser };
      } catch (err) {
        console.warn('Firebase anonymous auth failed, falling back to local guest session:', err);
      }
    }

    // Local in-browser guest profile (works even when Firebase is not configured or offline)
    const localGuestProfile: UserProfile = {
      uid: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: null,
      displayName: displayName || 'Guest Educator',
      photoURL: null,
      role,
      isGuest: true,
      createdAt: Date.now(),
    };

    localStorage.setItem('studycanvas_user_profile', JSON.stringify(localGuestProfile));
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(localGuestProfile));

    return { user: localGuestProfile, firebaseUser: null };
  },

  /**
   * Signs out the current user and clears session tokens
   */
  async signOut(): Promise<void> {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(GUEST_STORAGE_KEY);
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
      isGuest: fbUser.isAnonymous || false,
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
