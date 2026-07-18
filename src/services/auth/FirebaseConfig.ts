import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean { return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId); }
export function getFirebaseApp(): FirebaseApp | null { return isFirebaseConfigured() ? (getApps().length ? getApp() : initializeApp(config)) : null; }
export function getFirebaseAuth(): Auth | null { const app = getFirebaseApp(); return app ? getAuth(app) : null; }
export function getFirebaseFirestore(): Firestore | null { const app = getFirebaseApp(); return app ? getFirestore(app) : null; }
