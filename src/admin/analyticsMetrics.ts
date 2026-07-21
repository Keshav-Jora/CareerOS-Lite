import type { AnalyticsRecord } from './AnalyticsDashboardRepository';

interface MetricPoint { label: string; value: number; }

export interface AdminAnalyticsMetrics {
  overview: { totalUsers: number; dau: number; wau: number; mau: number; averageSessionMs: number; conversations: number; feedbackScore: number | null; };
  providerUsage: MetricPoint[];
  responseTimes: MetricPoint[];
  intentDistribution: MetricPoint[];
  featureUsage: MetricPoint[];
  errors: MetricPoint[];
  feedbackTrend: MetricPoint[];
  userInsights: { returningUsers: number; averageConversations: number; newUsers: number; retention: number | null; };
  providerSuccessRate: number | null;
  providerFailures: number;
  fallbackCount: number;
}

const DAY = 86_400_000;
const daysAgo = (days: number, now: number) => now - days * DAY;
const countBy = (labels: readonly string[], get: (label: string) => number): MetricPoint[] => labels.map((label) => ({ label, value: get(label) }));

export function deriveAnalyticsMetrics(records: AnalyticsRecord[], now = Date.now()): AdminAnalyticsMetrics {
  const users = new Set(records.map(({ userId }) => userId).filter((id) => id && id !== 'anonymous'));
  const activeUsers = (since: number) => new Set(records.filter((item) => item.timestamp.getTime() >= since).map((item) => item.userId).filter((id) => id && id !== 'anonymous')).size;
  const events = (event: string) => records.filter((item) => item.event === event);
  const providerEvents = events('provider_used');
  const providerFailures = events('provider_failed').length;
  const feedbackPositive = events('feedback_positive').length;
  const feedbackNegative = events('feedback_negative').length;
  const conversations = events('chat_completed');
  const sessionStarts = new Map(events('session_start').map((item) => [item.sessionId, item.timestamp.getTime()]));
  const sessionLengths = events('session_end').flatMap((item) => {
    const start = sessionStarts.get(item.sessionId);
    return start && item.timestamp.getTime() >= start ? [item.timestamp.getTime() - start] : [];
  });
  const perUserConversations = new Map<string, number>();
  conversations.forEach(({ userId }) => perUserConversations.set(userId, (perUserConversations.get(userId) ?? 0) + 1));
  const userDays = new Map<string, Set<string>>();
  records.forEach(({ userId, timestamp }) => {
    if (!userId || userId === 'anonymous') return;
    const day = timestamp.toISOString().slice(0, 10);
    const values = userDays.get(userId) ?? new Set<string>();
    values.add(day); userDays.set(userId, values);
  });
  const recentUsers = new Set(records.filter((item) => item.timestamp.getTime() >= daysAgo(7, now)).map((item) => item.userId));
  const priorUsers = new Set(records.filter((item) => item.timestamp.getTime() >= daysAgo(14, now) && item.timestamp.getTime() < daysAgo(7, now)).map((item) => item.userId));
  const providerNames = Array.from(new Set(providerEvents.map((item) => item.provider).filter(Boolean) as string[]));
  const providerUsage = countBy(providerNames, (provider) => providerEvents.filter((item) => item.provider === provider).length);
  const responseTimes = countBy(providerNames, (provider) => {
    const values = providerEvents.filter((item) => item.provider === provider).map((item) => item.responseTime).filter((value): value is number => typeof value === 'number');
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  });
  const intents = records.map((item) => typeof item.metadata?.intent === 'string' ? item.metadata.intent : null).filter((value): value is string => Boolean(value));
  const featureUsage = [
    ['Dashboard', 'dashboard_opened'], ['Nova AI', 'chat_started'], ['Journey', 'journey_opened'], ['Opportunities', 'opportunities_opened'], ['Settings', 'settings_opened'], ['Roadmaps', 'roadmap_generated'],
  ].map(([label, event]) => ({ label, value: events(event).length }));
  const feedbackTrend = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now - (6 - index) * DAY); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + DAY;
    return { label: start.toLocaleDateString(undefined, { weekday: 'short' }), value: records.filter((item) => item.timestamp.getTime() >= start.getTime() && item.timestamp.getTime() < end && item.event === 'feedback_positive').length - records.filter((item) => item.timestamp.getTime() >= start.getTime() && item.timestamp.getTime() < end && item.event === 'feedback_negative').length };
  });
  const attempts = providerEvents.length + providerFailures;

  return {
    overview: { totalUsers: users.size, dau: activeUsers(daysAgo(1, now)), wau: activeUsers(daysAgo(7, now)), mau: activeUsers(daysAgo(30, now)), averageSessionMs: sessionLengths.length ? Math.round(sessionLengths.reduce((sum, value) => sum + value, 0) / sessionLengths.length) : 0, conversations: conversations.length, feedbackScore: feedbackPositive + feedbackNegative ? Math.round((feedbackPositive / (feedbackPositive + feedbackNegative)) * 100) : null },
    providerUsage,
    responseTimes,
    intentDistribution: countBy(Array.from(new Set(intents)), (intent) => intents.filter((value) => value === intent).length),
    featureUsage,
    errors: [{ label: 'Firebase', value: events('firebase_error').length }, { label: 'AI', value: events('ai_error').length }, { label: 'Provider', value: providerFailures }, { label: 'Network', value: events('app_error').length }],
    feedbackTrend,
    userInsights: { returningUsers: Array.from(userDays.values()).filter((days) => days.size > 1).length, averageConversations: perUserConversations.size ? Math.round((conversations.length / perUserConversations.size) * 10) / 10 : 0, newUsers: events('user_signup').length, retention: priorUsers.size ? Math.round((Array.from(recentUsers).filter((id) => priorUsers.has(id)).length / priorUsers.size) * 100) : null },
    providerSuccessRate: attempts ? Math.round((providerEvents.length / attempts) * 100) : null,
    providerFailures,
    fallbackCount: events('fallback_used').length,
  };
}
