import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/authService';
import { AuthContextType, UserProfile, EducatorRole } from '@/types/auth';
import { isFirebaseInitialized } from '@/config/firebase';

const defaultGuestProfile: UserProfile = {
  uid: 'educator-demo-user',
  email: 'professor@studycanvas.edu',
  displayName: 'Professor Canvas',
  photoURL: null,
  role: 'professor',
  institution: 'Science & Arts Academy',
  subjectSpecialty: 'Mathematics & Computer Science',
  createdAt: 1700000000000,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check if profile exists in local storage
    const cached = localStorage.getItem('studycanvas_user_profile');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fall back to default
      }
    }
    return !isFirebaseInitialized ? defaultGuestProfile : null;
  });

  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => {
    return authService.getStoredDriveToken();
  });
  const [loading, setLoading] = useState(isFirebaseInitialized);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      return;
    }

    const unsubscribe = authService.onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await authService.syncUserProfile(fbUser);
          setUser(profile);
          localStorage.setItem('studycanvas_user_profile', JSON.stringify(profile));
        } catch (e: any) {
          setError(e.message || 'Failed to sync user profile');
        }
      } else {
        setUser(null);
        localStorage.removeItem('studycanvas_user_profile');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const result = await authService.signInWithGoogle();
      setUser(result.user);
      setDriveAccessToken(result.driveAccessToken);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || 'Google Sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      setUser(null);
      setDriveAccessToken(null);
      setFirebaseUser(null);
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
    }
  }, []);

  const refreshDriveToken = useCallback(async (): Promise<string | null> => {
    try {
      const { driveAccessToken: newToken } = await authService.signInWithGoogle();
      setDriveAccessToken(newToken);
      return newToken;
    } catch (e) {
      console.warn('Could not refresh drive token:', e);
      return null;
    }
  }, []);

  const updateRole = useCallback(async (role: EducatorRole) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, role };
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(updated));
      return updated;
    });
    if (isFirebaseInitialized && user?.uid) {
      await authService.updateUserRole(user.uid, role);
    }
  }, [user?.uid]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    firebaseUser,
    loading,
    error,
    driveAccessToken,
    signInWithGoogle,
    signOut,
    refreshDriveToken,
    updateRole,
  }), [user, firebaseUser, loading, error, driveAccessToken, signInWithGoogle, signOut, refreshDriveToken, updateRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '@/hooks/useAuth';
