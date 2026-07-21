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
  private static started = false;

  static track(event: AnalyticsEvent): void {
    try {
      if (!AnalyticsConfig.enabled) return;
      this.ensureSession();
      this.write(event);
    } catch (error) {
      if (AnalyticsConfig.isDevelopment) console.debug('[Analytics] Event skipped.', error);
    }
  }

  private static ensureSession(): void {
    if (this.session) return;
    this.session = new SessionManager(() => this.write({ event: 'session_end' }));
    this.write({ event: 'session_start' });
  }

  private static write(event: AnalyticsEvent): void {
    const document: AnalyticsEventDocument = {
      ...event,
      userId: this.userId(),
      sessionId: this.session?.id ?? 'unavailable',
      metadata: this.safeMetadata(event.metadata),
    };
    this.repository.write(document);
  }

  private static userId(): string {
    try { return getFirebaseAuth()?.currentUser?.uid ?? 'anonymous'; } catch { return 'anonymous'; }
  }

  private static safeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => !restrictedMetadataKey.test(key) && isSafeValue(value)));
  }
}

function isSafeValue(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}
