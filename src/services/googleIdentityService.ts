import { DRIVE_FILE_SCOPE } from '@/types/drive';

// Types for Google Identity Services (GIS)
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: any) => void;
            prompt?: string;
          }): GoogleTokenClient;
          revoke(token: string, callback?: () => void): void;
        };
      };
    };
  }
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GoogleTokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

const TOKEN_STORAGE_KEY = 'studycanvas_drive_token';
const EXPIRES_AT_KEY = 'studycanvas_drive_token_expires';
const SCOPE_STORAGE_KEY = 'studycanvas_drive_scope';

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage !== 'undefined') return sessionStorage;
  if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
  return null;
}

export const googleIdentityService = {
  /**
   * Returns the configured Google OAuth 2.0 Client ID
   */
  getClientId(): string {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      ''
    );
  },

  /**
   * Checks if Google Client ID is configured in environment
   */
  isConfigured(): boolean {
    const id = this.getClientId();
    return Boolean(id && !id.includes('your_google_oauth_client_id'));
  },

  /**
   * Ensures the Google Identity Services (GIS) script is loaded
   */
  async ensureScriptLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (window.google?.accounts?.oauth2) {
      return true;
    }

    // Check if script tag exists
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      // Wait for it to initialize
      return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts > 50) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
      });
    }

    // Inject script dynamically
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        resolve(Boolean(window.google?.accounts?.oauth2));
      };
      script.onerror = () => {
        resolve(false);
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Retrieves a non-expired access token if available in sessionStorage
   */
  getValidToken(): string | null {
    const storage = getSessionStorage();
    if (!storage) return null;

    try {
      const token = storage.getItem(TOKEN_STORAGE_KEY);
      const expiresAtStr = storage.getItem(EXPIRES_AT_KEY);
      if (!token || !expiresAtStr) return null;

      const expiresAt = parseInt(expiresAtStr, 10);
      // Give a 60-second safety buffer before true expiry
      if (Date.now() >= expiresAt - 60000) {
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },

  /**
   * Gets expiration timestamp for currently stored token
   */
  getExpiresAt(): number | null {
    const storage = getSessionStorage();
    if (!storage) return null;
    try {
      const expiresAtStr = storage.getItem(EXPIRES_AT_KEY);
      return expiresAtStr ? parseInt(expiresAtStr, 10) : null;
    } catch {
      return null;
    }
  },

  /**
   * Checks if stored token is expired
   */
  isExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    return Date.now() >= expiresAt - 60000;
  },

  /**
   * Stores access token securely in sessionStorage with expiration
   */
  saveToken(token: string, expiresInSeconds: number, scope: string = DRIVE_FILE_SCOPE): void {
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      storage.setItem(TOKEN_STORAGE_KEY, token);
      storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
      storage.setItem(SCOPE_STORAGE_KEY, scope);
    } catch (e) {
      console.warn('Failed to store Drive token in sessionStorage:', e);
    }
  },

  /**
   * Clears stored tokens
   */
  clearToken(): void {
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      storage.removeItem(TOKEN_STORAGE_KEY);
      storage.removeItem(EXPIRES_AT_KEY);
      storage.removeItem(SCOPE_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Requests a fresh Google Drive access token using Google Identity Services token client
   * Uses the narrowest practical scope (DRIVE_FILE_SCOPE: https://www.googleapis.com/auth/drive.file)
   */
  async requestDriveAccessToken(options: {
    prompt?: 'consent' | '' | 'select_account';
    scope?: string;
  } = {}): Promise<string> {
    const clientId = this.getClientId();
    if (!clientId || clientId.includes('your_google_oauth_client_id')) {
      throw new Error(
        'Google OAuth Client ID is missing. Add VITE_GOOGLE_CLIENT_ID to your .env.local file from Google Cloud Console.'
      );
    }

    const isLoaded = await this.ensureScriptLoaded();
    if (!isLoaded || !window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services client failed to load. Check your network connection.');
    }

    const scope = options.scope || DRIVE_FILE_SCOPE;
    const prompt = options.prompt !== undefined ? options.prompt : '';

    return new Promise((resolve, reject) => {
      let client: GoogleTokenClient;

      try {
        client = window.google!.accounts!.oauth2!.initTokenClient({
          client_id: clientId,
          scope,
          prompt,
          callback: (response: GoogleTokenResponse) => {
            if (response.error) {
              const err = new Error(
                response.error_description || `Google Drive authorization error: ${response.error}`
              );
              (err as any).code = response.error;
              reject(err);
              return;
            }

            if (!response.access_token) {
              reject(new Error('No access token received from Google Identity Services.'));
              return;
            }

            this.saveToken(response.access_token, response.expires_in || 3599, response.scope || scope);
            resolve(response.access_token);
          },
          error_callback: (err: any) => {
            const error = new Error(
              err?.message || 'Google Drive authorization was closed or denied.'
            );
            (error as any).code = 'auth/popup-closed';
            reject(error);
          },
        });

        client.requestAccessToken({ prompt });
      } catch (e: any) {
        reject(e);
      }
    });
  },

  /**
   * Revokes Google Drive access and removes local tokens
   */
  async revokeDriveAccess(): Promise<void> {
    const token = this.getValidToken();
    this.clearToken();

    if (!token || typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return;
    }

    return new Promise((resolve) => {
      try {
        window.google!.accounts!.oauth2!.revoke(token, () => {
          resolve();
        });
      } catch {
        resolve();
      }
    });
  },
};
