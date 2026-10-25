import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => {
    return googleIdentityService.getValidToken() || authService.getStoredDriveToken();
  });
  // Loading starts true only when Firebase is initialized so initial auth token is resolved without flicker
  const [loading, setLoading] = useState<boolean>(Boolean(isFirebaseInitialized));
  const [error, setError] = useState<string | null>(null);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);

  // Use a ref for retry callback to avoid accessing variable during initialization
  const signInWithGoogleRef = useRef<(() => Promise<void>) | null>(null);

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

  const signInWithGoogle = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const result = await authService.signInWithGoogle();
      
      // Update state strictly from authenticated result
      setUser(result.user);
      setFirebaseUser(result.firebaseUser);
      setDriveAccessToken(result.driveAccessToken);
      localStorage.setItem('studycanvas_user_profile', JSON.stringify(result.user));

      // Display polished toast notification ONLY after true successful sign-in
      success('Successfully signed in. Welcome to StudyCanvas!', 'Welcome Back');
    } catch (err: unknown) {
      const errInfo = formatAuthError(err);
      console.warn('Google Sign-in failed:', errInfo);
      setError(errInfo.message);
      setAuthErrorInfo(errInfo);

      if (errInfo.isCancelled) {
        info('Sign-in cancelled. You can try again whenever you are ready.', 'Sign In');
      } else if (errInfo.isPopupBlocked) {
        toastError(
          'Sign-in window blocked by your browser. Please enable popups for StudyCanvas and retry.',
          'Popup Blocked',
          {
            label: 'Retry Sign In',
            onClick: () => {
              void signInWithGoogleRef.current?.();
            },
          }
        );
      } else if (errInfo.isConfigMissing) {
        toastError(
          'Firebase Authentication keys not found in .env.local. Add VITE_FIREBASE_* variables to enable Google login.',
          'Configuration Required'
        );
      } else {
        toastError(
          errInfo.message,
          'Authentication Failed',
          errInfo.isRetryable
            ? {
                label: 'Try Again',
                onClick: () => {
                  void signInWithGoogleRef.current?.();
                },
              }
            : undefined
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, success, toastError, info]);

  // Keep ref synchronized
  useEffect(() => {
    signInWithGoogleRef.current = signInWithGoogle;
  }, [signInWithGoogle]);

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
      // If GIS client ID is not yet configured, check stored token
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

    if (isFirebaseInitialized && user?.uid) {
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
      driveAccessToken,
      signInWithGoogle,
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
      signInWithGoogle,
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
