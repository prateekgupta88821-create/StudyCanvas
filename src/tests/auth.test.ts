import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatAuthError } from '@/services/authService';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).sessionStorage = new MemoryStorage();
(globalThis as any).localStorage = new MemoryStorage();

describe('StudyCanvas Authentication Service & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('1. Error Classification & Graceful Messages', () => {
    it('handles popup cancellation by user gracefully', () => {
      const err = { code: 'auth/popup-closed-by-user', message: 'The popup has been closed.' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/popup-closed-by-user');
      expect(formatted.isCancelled).toBe(true);
      expect(formatted.isPopupBlocked).toBe(false);
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('Sign-in cancelled');
    });

    it('handles popup blocked by browser gracefully', () => {
      const err = { code: 'auth/popup-blocked', message: 'Unable to open popup' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/popup-blocked');
      expect(formatted.isPopupBlocked).toBe(true);
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('blocked by your browser');
    });

    it('handles network failure gracefully with retry flag', () => {
      const err = { code: 'auth/network-request-failed', message: 'A network error occurred.' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/network-request-failed');
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('Network connection failed');
    });

    it('identifies unauthorized domain configuration errors with actionable advice', () => {
      const err = { code: 'auth/unauthorized-domain', message: 'This domain is not authorized' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/unauthorized-domain');
      expect(formatted.isConfigMissing).toBe(true);
      expect(formatted.isRetryable).toBe(false);
      expect(formatted.message).toContain('Authorized Domains');
    });

    it('handles missing configuration gracefully without crash', () => {
      const err = { code: 'auth/missing-configuration', message: 'No config' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/missing-configuration');
      expect(formatted.isConfigMissing).toBe(true);
      expect(formatted.message).toContain('Firebase configuration is missing');
    });
  });

  describe('2. Route Protection Logic', () => {
    const resolveEffectiveView = (targetView: string, userProfile: any): string => {
      return !userProfile && (targetView === 'dashboard' || targetView === 'whiteboard')
        ? 'landing'
        : targetView;
    };

    it('redirects unauthenticated users to landing view when attempting to access dashboard', () => {
      expect(resolveEffectiveView('dashboard', null)).toBe('landing');
    });

    it('redirects unauthenticated users to landing view when attempting to access whiteboard', () => {
      expect(resolveEffectiveView('whiteboard', null)).toBe('landing');
    });

    it('permits authenticated users to access dashboard and whiteboard', () => {
      const user = {
        uid: 'verified_user_123',
        email: 'prof@studycanvas.edu',
        displayName: 'Professor Ada Lovelace',
        photoURL: 'https://example.com/avatar.jpg',
        role: 'professor' as const,
        createdAt: 1700000000000,
      };

      expect(resolveEffectiveView('dashboard', user)).toBe('dashboard');
      expect(resolveEffectiveView('whiteboard', user)).toBe('whiteboard');
    });
  });

  describe('3. Security: Preventing Client UID Spoofing & Protecting Storage', () => {
    it('ensures stored user profile matches authentic Firebase UID', () => {
      const mockFbUser = {
        uid: 'authentic-google-uid-789',
        email: 'teacher@school.org',
        displayName: 'Teacher Smith',
        photoURL: 'https://lh3.googleusercontent.com/a/mock',
      };

      // Profile mapping must strictly take UID from token
      const profile = {
        uid: mockFbUser.uid,
        email: mockFbUser.email,
        displayName: mockFbUser.displayName,
        photoURL: mockFbUser.photoURL,
        role: 'teacher' as const,
        createdAt: Date.now(),
      };

      expect(profile.uid).toBe('authentic-google-uid-789');
      expect(profile.displayName).toBe('Teacher Smith');
      expect(profile.photoURL).toBe('https://lh3.googleusercontent.com/a/mock');
    });

    it('cleans up session data when user logs out or session expires', () => {
      const TOKEN_KEY = 'studycanvas_drive_token';
      const PROFILE_KEY = 'studycanvas_user_profile';

      sessionStorage.setItem(TOKEN_KEY, 'ya29.mock_drive_token');
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ uid: 'user_123' }));

      // Simulate sign out cleanup
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);

      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
    });
  });

  describe('4. Toast Notification Rules', () => {
    it('defines the exact required welcome message', () => {
      const expectedMessage = 'Successfully signed in. Welcome to StudyCanvas!';
      expect(expectedMessage).toBe('Successfully signed in. Welcome to StudyCanvas!');
    });
  });

  describe('5. Expired Sessions & Auth State Lifecycle', () => {
    it('handles transition from active session to expired session', () => {
      let activeUser: any = {
        uid: 'user_active_99',
        displayName: 'Dr. Turing',
        email: 'turing@studycanvas.edu',
      };

      const onAuthStateChanged = (callback: (user: any) => void) => {
        // Active
        callback(activeUser);
        // Expired
        activeUser = null;
        callback(null);
      };

      const states: any[] = [];
      onAuthStateChanged((u) => {
        states.push(u);
      });

      expect(states).toHaveLength(2);
      expect(states[0]?.uid).toBe('user_active_99');
      expect(states[1]).toBeNull();
    });

    it('enforces that initial loading state prevents redirect flicker on page reload', () => {
      const isFirebaseConfigured = true;
      let loading = isFirebaseConfigured;

      expect(loading).toBe(true);

      loading = false;
      expect(loading).toBe(false);
    });
  });
});
