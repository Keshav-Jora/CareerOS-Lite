export type AnalyticsEventName =
  | 'user_signup' | 'user_login' | 'user_logout'
  | 'app_open' | 'session_start' | 'session_end'
  | 'chat_started' | 'chat_completed' | 'provider_used' | 'provider_failed' | 'fallback_used'
  | 'dashboard_opened' | 'roadmap_generated' | 'recommendation_opened' | 'settings_opened'
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
