import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import { AnalyticsConfig } from './AnalyticsConfig';
import type { AnalyticsEventDocument } from './EventTypes';

/** Firestore boundary for the sole analytics collection. All writes are intentionally detached. */
export class AnalyticsRepository {
  write(event: AnalyticsEventDocument): void {
    try {
      const firestore = getFirebaseFirestore();
      if (!firestore || !navigator.onLine) return;
      void addDoc(collection(firestore, 'analytics_events'), {
        ...event,
        timestamp: serverTimestamp(),
      }).catch((error: unknown) => {
        if (AnalyticsConfig.isDevelopment) console.debug('[Analytics] Firestore write skipped.', error);
      });
    } catch (error) {
      if (AnalyticsConfig.isDevelopment) console.debug('[Analytics] Firestore unavailable.', error);
    }
  }
}
