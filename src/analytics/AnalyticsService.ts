import { onAuthStateChanged, type Unsubscribe, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../services/auth/FirebaseConfig';
import { AnalyticsConfig } from './AnalyticsConfig';
import { AnalyticsRepository } from './AnalyticsRepository';
import type { AnalyticsEvent, AnalyticsEventDocument } from './EventTypes';
import { SessionManager } from './SessionManager';

const restrictedMetadataKey = /(?:conversation|prompt|resume|api.?key|token|email|content|message|text)/i;

/** The only application-facing analytics API. It never blocks or throws. */
export class AnalyticsService {
  private static repository = new AnalyticsRepository();
  private static session: SessionManager | null = null;
  private static pendingEvents: AnalyticsEvent[] = [];
  private static authUnsubscribe: Unsubscribe | null = null;

  static track(event: AnalyticsEvent): void {
    try {
      this.log('track()', { event: event.event, feature: event.feature });
      if (!AnalyticsConfig.enabled) {
        if (AnalyticsConfig.isDevelopment) console.warn('[Analytics] Tracking is disabled. Set ENABLE_ANALYTICS=true and restart Vite.');
        return;
      }
      this.ensureSession();
      const user = getFirebaseAuth()?.currentUser;
      if (user) {
        this.log('auth already available', { event: event.event, userId: user.uid });
        this.write(event, user.uid);
      } else this.queueUntilAuthenticated(event);
    } catch (error) {
      if (AnalyticsConfig.isDevelopment) console.debug('[Analytics] Event skipped.', error);
    }
  }

  private static ensureSession(): void {
    if (this.session) return;
    this.session = new SessionManager(() => this.track({ event: 'session_end' }));
    this.track({ event: 'session_start' });
  }

  private static queueUntilAuthenticated(event: AnalyticsEvent): void {
    const auth = getFirebaseAuth();
    if (!auth) {
      if (AnalyticsConfig.isDevelopment) console.warn('[Analytics] Event skipped: Firebase Auth is unavailable.');
      return;
    }
    this.pendingEvents.push(event);
    this.log('event queued', { event: event.event, queueLength: this.pendingEvents.length });
    this.ensureAuthObserver(auth);
  }

  private static ensureAuthObserver(auth: NonNullable<ReturnType<typeof getFirebaseAuth>>): void {
    if (this.authUnsubscribe) return;
    this.log('subscribing to Firebase Auth state', { queueLength: this.pendingEvents.length });
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      this.log('Firebase Auth state resolved', { authenticated: Boolean(user), userId: user?.uid, queueLength: this.pendingEvents.length });
      if (!user) return;
      this.flushQueue(user);
    });
  }

  private static flushQueue(user: User): void {
    const events = this.pendingEvents.splice(0);
    this.log('flushing queued events', { count: events.length, userId: user.uid });
    events.forEach((pendingEvent) => this.write(pendingEvent, user.uid));
  }

  private static write(event: AnalyticsEvent, userId: string): void {
    const document: AnalyticsEventDocument = {
      ...event,
      userId,
      sessionId: this.session?.id ?? 'unavailable',
      metadata: this.safeMetadata(event.metadata),
    };
    this.log('dispatching write', { event: document.event, sessionId: document.sessionId, userId: document.userId });
    this.repository.write(document);
  }

  private static log(transition: string, details: Record<string, unknown>): void {
    if (AnalyticsConfig.isDevelopment) console.info(`[Analytics ${new Date().toISOString()}] ${transition}`, details);
  }

  private static safeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => !restrictedMetadataKey.test(key) && isSafeValue(value)));
  }
}

function isSafeValue(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}
