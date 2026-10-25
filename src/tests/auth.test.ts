import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatAuthError, authService } from '@/services/authService';

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

  describe('1. Error Classification & Graceful Messages for Email/Password Auth', () => {
    it('handles email already in use error gracefully', () => {
      const err = { code: 'auth/email-already-in-use', message: 'Email in use' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/email-already-in-use');
      expect(formatted.isRetryable).toBe(false);
      expect(formatted.message).toContain('already registered');
    });

    it('handles invalid email format error gracefully', () => {
      const err = { code: 'auth/invalid-email', message: 'Bad format' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/invalid-email');
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('invalid');
    });

    it('handles weak password error with actionable guidance', () => {
      const err = { code: 'auth/weak-password', message: 'Weak' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/weak-password');
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('at least 6 characters');
    });

    it('handles invalid credentials / wrong password gracefully', () => {
      const err = { code: 'auth/invalid-credential', message: 'Bad creds' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/invalid-credential');
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('Invalid email or password');
    });

    it('handles network failure gracefully with retry flag', () => {
      const err = { code: 'auth/network-request-failed', message: 'A network error occurred.' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/network-request-failed');
      expect(formatted.isRetryable).toBe(true);
      expect(formatted.message).toContain('Network connection failed');
    });

    it('handles missing configuration gracefully without crash', () => {
      const err = { code: 'auth/missing-configuration', message: 'No config' };
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe('auth/missing-configuration');
      expect(formatted.isConfigMissing).toBe(true);
      expect(formatted.message).toContain('Firebase configuration is missing');
    });
  });

  describe('2. Guest Mode & Local Authentication Fallback', () => {
    it('creates an active guest user session with isGuest flag when Firebase is unconfigured', async () => {
      const result = await authService.signInAsGuest('Professor Ada', 'professor');

      expect(result.user).toBeDefined();
      expect(result.user.uid).toMatch(/^guest_/);
      expect(result.user.displayName).toBe('Professor Ada');
      expect(result.user.role).toBe('professor');
      expect(result.user.isGuest).toBe(true);
      expect(result.user.email).toBeNull();
    });

    it('persists guest session in local storage for session recovery', async () => {
      await authService.signInAsGuest('Student Marie', 'student');
      const savedProfile = localStorage.getItem('studycanvas_user_profile');
      expect(savedProfile).not.toBeNull();

      const parsed = JSON.parse(savedProfile!);
      expect(parsed.isGuest).toBe(true);
      expect(parsed.displayName).toBe('Student Marie');
    });
  });

  describe('3. Route Protection Logic', () => {
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

    it('permits authenticated email users to access dashboard and whiteboard', () => {
      const user = {
        uid: 'verified_email_user_123',
        email: 'prof@studycanvas.edu',
        displayName: 'Professor Ada Lovelace',
        photoURL: null,
        role: 'professor' as const,
        isGuest: false,
        createdAt: 1700000000000,
      };

      expect(resolveEffectiveView('dashboard', user)).toBe('dashboard');
      expect(resolveEffectiveView('whiteboard', user)).toBe('whiteboard');
    });

    it('permits guest users to access dashboard and whiteboard in guest mode', () => {
      const guestUser = {
        uid: 'guest_1700000000000_abc',
        email: null,
        displayName: 'Guest Educator',
        photoURL: null,
        role: 'teacher' as const,
        isGuest: true,
        createdAt: 1700000000000,
      };

      expect(resolveEffectiveView('dashboard', guestUser)).toBe('dashboard');
      expect(resolveEffectiveView('whiteboard', guestUser)).toBe('whiteboard');
    });
  });

  describe('4. Sign-Out & Session Cleanup', () => {
    it('cleans up local storage and guest session when signing out', async () => {
      localStorage.setItem('studycanvas_user_profile', JSON.stringify({ uid: 'user_123' }));
      localStorage.setItem('studycanvas_guest_session', JSON.stringify({ uid: 'guest_123' }));
      sessionStorage.setItem('studycanvas_drive_token', 'mock_token');

      await authService.signOut();

      expect(localStorage.getItem('studycanvas_user_profile')).toBeNull();
      expect(localStorage.getItem('studycanvas_guest_session')).toBeNull();
      expect(sessionStorage.getItem('studycanvas_drive_token')).toBeNull();
    });
  });
});
