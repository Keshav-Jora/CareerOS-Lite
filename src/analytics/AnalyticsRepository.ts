import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseApp, getFirebaseFirestore } from '../services/auth/FirebaseConfig';
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
      // Firestore rejects undefined optional fields, including metadata on events without metadata.
      const document = Object.fromEntries(Object.entries({
        ...event,
        timestamp: serverTimestamp(),
      }).filter(([, value]) => value !== undefined));
      const events = collection(firestore, 'analytics_events');
      const eventReference = doc(events);
      if (AnalyticsConfig.isDevelopment) console.info(`[Analytics ${new Date().toISOString()}] before analytics event write`, {
        firestoreInstance: firestore.app.name,
        projectId: getFirebaseApp()?.options.projectId,
        database: '(default)',
        collectionPath: events.path,
        payload: document,
      });
      // setDoc on a generated ID makes transport retries idempotent; addDoc uses a create-only precondition.
      void setDoc(eventReference, document).then(() => {
        if (AnalyticsConfig.isDevelopment) console.info(`[Analytics ${new Date().toISOString()}] analytics event write resolved`, { documentPath: eventReference.path, documentId: eventReference.id, event: event.event, projectId: getFirebaseApp()?.options.projectId });
      }).catch((error: unknown) => {
        const firebaseError = error as { code?: unknown; message?: unknown };
        console.error(`[Analytics ${new Date().toISOString()}] analytics event write rejected`, {
          code: firebaseError.code,
          message: firebaseError.message,
          collectionPath: events.path,
          projectId: getFirebaseApp()?.options.projectId,
          fullError: error,
        });
      });
    } catch (error) {
      console.error('[Analytics] Firestore write setup failed', error);
    }
  }
}
