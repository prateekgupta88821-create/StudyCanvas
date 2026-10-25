import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService, formatAuthError, type AuthErrorInfo } from '@/services/authService';
import { googleIdentityService } from '@/services/googleIdentityService';
import { AuthContextType, UserProfile, EducatorRole } from '@/types/auth';
import { isFirebaseInitialized } from '@/config/firebase';
import { useToast } from '@/hooks/useToast';
import { AuthContext } from './AuthContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error: toastError, info } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('studycanvas_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => {
    return googleIdentityService.getValidToken() || authService.getStoredDriveToken();
  });
  // Loading starts true only when Firebase is initialized so initial auth token is resolved without flicker
  const [loading, setLoading] = useState<boolean>(Boolean(isFirebaseInitialized));
  const [error, setError] = useState<string | null>(null);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      return;
    }

    const unsubscribe = authService.onAuthStateChange(
      async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await authService.syncUserProfile(fbUser);
            setUser(profile);
            localStorage.setItem('studycanvas_user_profile', JSON.stringify(profile));
          } catch (e: any) {
            console.error('Failed to sync user profile:', e);
            const errInfo = formatAuthError(e);
            setError(errInfo.message);
            setAuthErrorInfo(errInfo);
          }
        } else {
          // Check if local guest session exists
          const saved = localStorage.getItem('studycanvas_user_profile');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed?.isGuest) {
                setUser(parsed);
                setLoading(false);
                return;
              }
            } catch {
              // Ignore
            }
          }
          // User is signed out or session expired
          setUser(null);
          setDriveAccessToken(null);
          localStorage.removeItem('studycanvas_user_profile');
        }
        setLoading(false);
      },
      (authStateError) => {
        console.warn('Session expired or auth state error:', authStateError);
        setUser(null);
        setFirebaseUser(null);
        setDriveAccessToken(null);
        setLoading(false);
        const errInfo = formatAuthError(authStateError);
        setError(errInfo.message);
        setAuthErrorInfo(errInfo);
      }
    );

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setAuthErrorInfo(null);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    clearError();
    setLoading(true);

    try {
      const result = await authService.signInWithEmail(email, password);
      setUser(result.user);
      setFirebaseUser(result.firebaseUser);
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(result.user));

      success(`Successfully signed in. Welcome back!`, 'Welcome');
    } catch (err: unknown) {
      const errInfo = formatAuthError(err);
      setError(errInfo.message);
      setAuthErrorInfo(errInfo);
      toastError(errInfo.message, 'Authentication Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, success, toastError]);

  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    displayName?: string, 
    role?: EducatorRole
  ) => {
    clearError();
    setLoading(true);

    try {
      const result = await authService.signUpWithEmail(email, password, displayName, role);
      setUser(result.user);
      setFirebaseUser(result.firebaseUser);
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(result.user));

      success('Account created successfully. Welcome to StudyCanvas!', 'Account Created');
    } catch (err: unknown) {
      const errInfo = formatAuthError(err);
      setError(errInfo.message);
      setAuthErrorInfo(errInfo);
      toastError(errInfo.message, 'Registration Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, success, toastError]);

  const signInAsGuest = useCallback(async (displayName?: string, role?: EducatorRole) => {
    clearError();
    setLoading(true);

    try {
      const result = await authService.signInAsGuest(displayName, role);
      setUser(result.user);
      setFirebaseUser(result.firebaseUser);
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(result.user));

      success('Continuing as Guest. All whiteboard tools are active!', 'Guest Mode Active');
    } catch (err: unknown) {
      const errInfo = formatAuthError(err);
      setError(errInfo.message);
      setAuthErrorInfo(errInfo);
      toastError(errInfo.message, 'Guest Sign-In Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, success, toastError]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await googleIdentityService.revokeDriveAccess();
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
      setDriveAccessToken(null);
      clearError();
      info('You have been signed out from StudyCanvas.', 'Signed Out');
    } catch (err: any) {
      const errInfo = formatAuthError(err);
      setError(errInfo.message);
      setAuthErrorInfo(errInfo);
      toastError(errInfo.message, 'Sign Out Error');
    } finally {
      setLoading(false);
    }
  }, [clearError, info, toastError]);

  const refreshDriveToken = useCallback(async (): Promise<string | null> => {
    try {
      if (googleIdentityService.isConfigured()) {
        const token = await googleIdentityService.requestDriveAccessToken();
        setDriveAccessToken(token);
        return token;
      }
      const stored = googleIdentityService.getValidToken() || authService.getStoredDriveToken();
      if (stored) {
        setDriveAccessToken(stored);
        return stored;
      }
      return null;
    } catch (e: any) {
      console.warn('Could not refresh drive token:', e);
      return null;
    }
  }, []);

  const updateRole = useCallback(async (role: EducatorRole) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, role };
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseInitialized && user?.uid && !user.isGuest) {
      await authService.updateUserRole(user.uid, role);
    }
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      firebaseUser,
      loading,
      error,
      authErrorInfo,
      isFirebaseConfigured: Boolean(isFirebaseInitialized),
      isGuest: Boolean(user?.isGuest),
      driveAccessToken,
      signInWithEmail,
      signUpWithEmail,
      signInAsGuest,
      signOut,
      clearError,
      refreshDriveToken,
      updateRole,
    }),
    [
      user,
      firebaseUser,
      loading,
      error,
      authErrorInfo,
      driveAccessToken,
      signInWithEmail,
      signUpWithEmail,
      signInAsGuest,
      signOut,
      clearError,
      refreshDriveToken,
      updateRole,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
