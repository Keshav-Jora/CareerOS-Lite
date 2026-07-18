import { onAuthStateChanged, type User, type Unsubscribe } from 'firebase/auth';
import { getFirebaseAuth } from './FirebaseConfig';

export class SessionManager {
  observe(callback: (user: User | null) => void): Unsubscribe { const auth = getFirebaseAuth(); if (!auth) { callback(null); return () => undefined; } return onAuthStateChanged(auth, callback); }
}
