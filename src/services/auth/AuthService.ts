import { GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from './FirebaseConfig';

export class AuthService {
  async signInWithGoogle(): Promise<User> { const auth = getFirebaseAuth(); if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to enable sign-in.'); return (await signInWithPopup(auth, new GoogleAuthProvider())).user; }
  async signOut(): Promise<void> { const auth = getFirebaseAuth(); if (auth) await signOut(auth); }
}
