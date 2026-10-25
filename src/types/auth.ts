export type EducatorRole = 'teacher' | 'professor' | 'student' | 'tutor';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: EducatorRole;
  institution?: string;
  subjectSpecialty?: string;
  createdAt: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: import('firebase/auth').User | null;
  loading: boolean;
  error: string | null;
  authErrorInfo: import('@/services/authService').AuthErrorInfo | null;
  isFirebaseConfigured: boolean;
  driveAccessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshDriveToken: () => Promise<string | null>;
  updateRole: (role: EducatorRole) => Promise<void>;
}
