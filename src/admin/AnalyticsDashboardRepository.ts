import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import type { AnalyticsEvent, AnalyticsEventName, AnalyticsUserProfile } from '../analytics/EventTypes';

export interface AnalyticsRecord extends AnalyticsEvent {
  event: AnalyticsEventName;
  userId: string;
  sessionId: string;
  timestamp: Date;
}

export interface AdminUserRecord extends AnalyticsUserProfile {
  joinedAt: Date | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
}

export interface AdminAnalyticsSnapshot {
  records: AnalyticsRecord[];
  users: AdminUserRecord[];
}

/** Read-only boundary for the existing analytics_events collection. */
export class AnalyticsDashboardRepository {
  async fetchSnapshot(days = 30): Promise<AdminAnalyticsSnapshot> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');
    const [records, users] = await Promise.all([this.fetchRecent(days), getDocs(collection(firestore, 'analytics_users'))]);
    return { records, users: users.docs.map((document) => this.userFromDocument(document.data())) };
  }

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

  private userFromDocument(data: Record<string, unknown>): AdminUserRecord {
    const date = (value: unknown): Date | null => value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function'
      ? (value as Timestamp).toDate()
      : null;
    return {
      uid: typeof data.uid === 'string' ? data.uid : '',
      displayName: typeof data.displayName === 'string' ? data.displayName : null,
      email: typeof data.email === 'string' ? data.email : null,
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
      providerId: typeof data.providerId === 'string' ? data.providerId : 'unknown',
      status: data.status === 'online' ? 'online' : 'offline',
      joinedAt: date(data.joinedAt),
      lastLoginAt: date(data.lastLoginAt),
      lastSeenAt: date(data.lastSeenAt),
    };
  }
}
