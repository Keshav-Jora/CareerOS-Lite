import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import { AnalyticsConfig } from './AnalyticsConfig';
import type { AnalyticsEventDocument } from './EventTypes';

/** Firestore boundary for the sole analytics collection. All writes are intentionally detached. */
export class AnalyticsRepository {
  write(event: AnalyticsEventDocument): void {
    try {
      const firestore = getFirebaseFirestore();
      if (!firestore) {
        if (AnalyticsConfig.isDevelopment) console.error('[Analytics] Firestore write not attempted: Firebase is not configured.');
        return;
      }
      if (!navigator.onLine) {
        if (AnalyticsConfig.isDevelopment) console.error('[Analytics] Firestore write not attempted: browser is offline.');
        return;
      }
      if (AnalyticsConfig.isDevelopment) console.info('[Analytics] attempting Firestore write', { collection: 'analytics_events', event: event.event });
      // Firestore rejects undefined optional fields, including metadata on events without metadata.
      const document = Object.fromEntries(Object.entries({
        ...event,
        timestamp: serverTimestamp(),
      }).filter(([, value]) => value !== undefined));
      void addDoc(collection(firestore, 'analytics_events'), document).then((savedDocument) => {
        if (AnalyticsConfig.isDevelopment) console.info('[Analytics] Firestore write succeeded', { collection: 'analytics_events', documentId: savedDocument.id, event: event.event });
      }).catch((error: unknown) => {
        // Keep analytics non-blocking, but never hide the provider error while debugging.
        console.error('[Analytics] Firestore write failed', error);
      });
    } catch (error) {
      console.error('[Analytics] Firestore write setup failed', error);
    }
  }
}
