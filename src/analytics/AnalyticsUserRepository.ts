import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import type { AnalyticsUserStatus } from './EventTypes';

/** Maintains the minimal profile index required by the read-only owner console. */
export class AnalyticsUserRepository {
  touch(user: User, status: AnalyticsUserStatus, includeLogin = false): void {
    try {
      const firestore = getFirebaseFirestore();
      if (!firestore) return;
      const providerId = user.providerData.find((provider) => provider.providerId)?.providerId ?? 'unknown';
      const profile = {
        uid: user.uid,
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        photoURL: user.photoURL ?? null,
        providerId,
        joinedAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
        lastSeenAt: serverTimestamp(),
        status,
        ...(includeLogin ? { lastLoginAt: serverTimestamp() } : {}),
      };
      void setDoc(doc(firestore, 'analytics_users', user.uid), profile, { merge: true });
    } catch {
      // Analytics profile indexing is intentionally non-blocking.
    }
  }
}
