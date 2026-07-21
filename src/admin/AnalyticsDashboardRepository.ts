import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import type { AnalyticsEvent, AnalyticsEventName } from '../analytics/EventTypes';

export interface AnalyticsRecord extends AnalyticsEvent {
  event: AnalyticsEventName;
  userId: string;
  sessionId: string;
  timestamp: Date;
}

/** Read-only boundary for the existing analytics_events collection. */
export class AnalyticsDashboardRepository {
  async fetchRecent(days = 30): Promise<AnalyticsRecord[]> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');

    const since = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await getDocs(query(
      collection(firestore, 'analytics_events'),
      where('timestamp', '>=', since),
      orderBy('timestamp', 'desc'),
      limit(10_000),
    ));

    return result.docs.map((document) => {
      const data = document.data() as Omit<AnalyticsRecord, 'timestamp'> & { timestamp?: Timestamp };
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.() ?? new Date(0),
      };
    });
  }
}
