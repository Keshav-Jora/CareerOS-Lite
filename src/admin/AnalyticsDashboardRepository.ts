import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import type { AnalyticsEvent, AnalyticsEventName, AnalyticsUserProfile } from '../analytics/EventTypes';
import type { FeedbackRecord, FeedbackStatus } from '../feedback/FeedbackTypes';

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
  feedback: FeedbackRecord[];
}

/** Read-only boundary for the existing analytics_events collection. */
export class AnalyticsDashboardRepository {
  async fetchSnapshot(days = 30): Promise<AdminAnalyticsSnapshot> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');
    const [records, feedback] = await Promise.all([this.fetchRecent(days), this.fetchFeedback()]);
    let users;
    try {
      users = await getDocs(collection(firestore, 'analytics_users'));
    } catch (error) {
      this.logQueryFailure('analytics_users', error);
      throw error;
    }
    return { records, users: users.docs.map((document) => this.userFromDocument(document.data())), feedback };
  }

  async fetchRecent(days = 30): Promise<AnalyticsRecord[]> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');

    const since = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
    let result;
    try {
      result = await getDocs(query(
        collection(firestore, 'analytics_events'),
        where('timestamp', '>=', since),
        orderBy('timestamp', 'desc'),
        limit(10_000),
      ));
    } catch (error) {
      this.logQueryFailure('analytics_events', error);
      throw error;
    }

    return result.docs.map((document) => {
      const data = document.data() as Omit<AnalyticsRecord, 'timestamp'> & { timestamp?: Timestamp };
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.() ?? new Date(0),
      };
    });
  }

  async fetchFeedback(): Promise<FeedbackRecord[]> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');
    try {
      const result = await getDocs(query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'), limit(250)));
      return result.docs.map((document) => {
        const data = document.data() as Omit<FeedbackRecord, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp; updatedAt?: Timestamp };
        return { ...data, id: document.id, createdAt: data.createdAt?.toDate?.() ?? new Date(0), updatedAt: data.updatedAt?.toDate?.() ?? null };
      });
    } catch (error) {
      this.logQueryFailure('feedback', error);
      throw error;
    }
  }

  async updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firebase analytics is not configured.');
    await updateDoc(doc(firestore, 'feedback', id), { status, updatedAt: serverTimestamp() });
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

  private logQueryFailure(collectionName: 'analytics_events' | 'analytics_users' | 'feedback', error: unknown): void {
    if (!import.meta.env.DEV) return;
    const firebaseError = error as { code?: unknown; message?: unknown };
    console.error(`[Owner Console] Firestore read failed: ${collectionName}`, { code: firebaseError.code, message: firebaseError.message, error });
  }
}
