export interface EnvConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  google: {
    clientId: string;
    apiKey: string;
  };
  isFirebaseConfigured: boolean;
  isGoogleDriveConfigured: boolean;
}

const getEnv = (key: string): string => {
  return import.meta.env[key] || '';
};

export const env: EnvConfig = {
  firebase: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID'),
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  google: {
    clientId: getEnv('VITE_GOOGLE_CLIENT_ID'),
    apiKey: getEnv('VITE_GOOGLE_API_KEY'),
  },
  get isFirebaseConfigured(): boolean {
    return Boolean(
      this.firebase.apiKey &&
      this.firebase.projectId &&
      this.firebase.appId
    );
  },
  get isGoogleDriveConfigured(): boolean {
    return Boolean(
      this.google.clientId || this.firebase.apiKey
    );
  }
};
