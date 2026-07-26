export type AnalyticsEventName =
  | 'user_signup' | 'user_login' | 'user_logout'
  | 'app_open' | 'session_start' | 'session_end'
  | 'chat_started' | 'chat_completed' | 'provider_used' | 'provider_failed' | 'fallback_used'
  | 'dashboard_opened' | 'roadmap_generated' | 'recommendation_opened' | 'settings_opened'
  | 'nova_opened' | 'goal_created' | 'goal_updated' | 'goal_deleted'
  | 'journey_added' | 'certificate_added' | 'note_created'
  | 'feedback_positive' | 'feedback_negative'
  | 'ai_error' | 'firebase_error' | 'app_error';

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  feature?: string;
  provider?: string;
  model?: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEventDocument extends AnalyticsEvent {
  userId: string;
  sessionId: string;
}

export type AnalyticsUserStatus = 'online' | 'offline';

export interface AnalyticsUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: string;
  joinedAt: Date | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  status: AnalyticsUserStatus;
}
