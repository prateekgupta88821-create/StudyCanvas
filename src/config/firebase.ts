import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  type Auth 
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { env } from './env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (env.isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(env.firebase) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);

    // Explicitly persist authentication session in browser local storage
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Failed to enforce browserLocalPersistence on Firebase Auth:', err);
    });
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
} else {
  console.info('StudyCanvas: Firebase configuration not found in environment.');
}

export { app, auth, db };
export const isFirebaseInitialized = Boolean(app && auth && db);
