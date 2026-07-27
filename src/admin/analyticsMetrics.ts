import type { AdminUserRecord, AnalyticsRecord } from './AnalyticsDashboardRepository';
import { presence } from './adminFormatters';
import type { AnalyticsUserStatus } from '../analytics/EventTypes';

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
  ownerOverview: { newUsersToday: number; currentOnlineUsers: number; };
  userGrowth: MetricPoint[];
}

const DAY = 86_400_000;
const daysAgo = (days: number, now: number) => now - days * DAY;
const countBy = (labels: readonly string[], get: (label: string) => number): MetricPoint[] => labels.map((label) => ({ label, value: get(label) }));

export interface AdminUserSummary extends Omit<AdminUserRecord, 'status'> {
  status: AnalyticsUserStatus | 'idle';
  totalSessions: number;
  averageSessionMs: number;
  conversations: number;
  goalsCreated: number;
  certificates: number;
  journeyEntries: number;
  notes: number;
  opportunities: number;
  lastActiveAt: Date | null;
}

export interface AdminActivity { id: string; userId: string; action: string; page: string; timestamp: Date; }

export function deriveUserSummaries(records: AnalyticsRecord[], users: AdminUserRecord[]): AdminUserSummary[] {
  const starts = records.filter((item) => item.event === 'session_start');
  const ends = new Map(records.filter((item) => item.event === 'session_end').map((item) => [item.sessionId, item.timestamp.getTime()]));
  const durations = new Map<string, number[]>();
  starts.forEach((item) => { const end = ends.get(item.sessionId); if (end && end >= item.timestamp.getTime()) { const values = durations.get(item.userId) ?? []; values.push(end - item.timestamp.getTime()); durations.set(item.userId, values); } });
  const indexedUsers = new Map(users.map((user) => [user.uid, user]));
  records.forEach((record) => {
    if (!record.userId || record.userId === 'anonymous' || indexedUsers.has(record.userId)) return;
    indexedUsers.set(record.userId, { uid: record.userId, displayName: null, email: null, photoURL: null, providerId: 'unknown', joinedAt: null, lastLoginAt: null, lastSeenAt: record.timestamp, status: 'offline' });
  });
  return Array.from(indexedUsers.values()).map((user) => {
    const userEvents = records.filter((item) => item.userId === user.uid);
    const userDurations = durations.get(user.uid) ?? [];
    const count = (event: string) => userEvents.filter((item) => item.event === event).length;
    const lastActiveAt = userEvents.reduce<Date | null>((latest, event) => !latest || event.timestamp > latest ? event.timestamp : latest, user.lastSeenAt);
    const currentStatus = presence(user.lastSeenAt);
    return { ...user, status: currentStatus, lastActiveAt, totalSessions: starts.filter((item) => item.userId === user.uid).length, averageSessionMs: userDurations.length ? Math.round(userDurations.reduce((sum, value) => sum + value, 0) / userDurations.length) : 0, conversations: count('chat_completed'), goalsCreated: count('goal_created'), opportunities: count('opportunities_opened'), certificates: count('certificate_added'), journeyEntries: count('journey_added'), notes: count('note_created') };
  }).sort((left, right) => (right.lastSeenAt?.getTime() ?? 0) - (left.lastSeenAt?.getTime() ?? 0));
}

export function deriveRecentActivities(records: AnalyticsRecord[]): AdminActivity[] {
  const labels: Partial<Record<string, string>> = { user_login: 'Logged in', user_logout: 'Logged out', dashboard_opened: 'Opened Dashboard', nova_opened: 'Opened Nova', chat_started: 'Started Nova chat', goal_created: 'Created goal', goal_updated: 'Updated goal', goal_deleted: 'Deleted goal', journey_added: 'Added journey entry', certificate_added: 'Added certificate', note_created: 'Created note', settings_opened: 'Opened Settings' };
  return records.filter((item) => labels[item.event]).slice(0, 10).map((item, index) => ({ id: `${item.sessionId}-${item.timestamp.getTime()}-${index}`, userId: item.userId, action: labels[item.event]!, page: item.feature ?? 'application', timestamp: item.timestamp }));
}

export function deriveAnalyticsMetrics(records: AnalyticsRecord[], users: AdminUserRecord[] = [], now = Date.now()): AdminAnalyticsMetrics {
  const userIds = new Set([...users.map(({ uid }) => uid), ...records.map(({ userId }) => userId)].filter((id) => id && id !== 'anonymous'));
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
    { label: 'Nova AI', value: events('chat_started').length },
    { label: 'Journey', value: events('journey_added').length },
    { label: 'Opportunities', value: events('opportunities_opened').length },
    { label: 'Notes', value: events('note_created').length },
    { label: 'Certificates', value: events('certificate_added').length },
    { label: 'Feedback', value: feedbackPositive + feedbackNegative },
  ];
  const feedbackTrend = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now - (6 - index) * DAY); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + DAY;
    return { label: start.toLocaleDateString(undefined, { weekday: 'short' }), value: records.filter((item) => item.timestamp.getTime() >= start.getTime() && item.timestamp.getTime() < end && item.event === 'feedback_positive').length - records.filter((item) => item.timestamp.getTime() >= start.getTime() && item.timestamp.getTime() < end && item.event === 'feedback_negative').length };
  });
  const attempts = providerEvents.length + providerFailures;

  return {
    overview: { totalUsers: userIds.size, dau: activeUsers(daysAgo(1, now)), wau: activeUsers(daysAgo(7, now)), mau: activeUsers(daysAgo(30, now)), averageSessionMs: sessionLengths.length ? Math.round(sessionLengths.reduce((sum, value) => sum + value, 0) / sessionLengths.length) : 0, conversations: conversations.length, feedbackScore: feedbackPositive + feedbackNegative ? Math.round((feedbackPositive / (feedbackPositive + feedbackNegative)) * 100) : null },
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
    ownerOverview: { newUsersToday: users.filter((user) => user.joinedAt && user.joinedAt.getTime() >= daysAgo(1, now)).length, currentOnlineUsers: users.filter((user) => presence(user.lastSeenAt, now) === 'online').length },
    userGrowth: Array.from({ length: 7 }, (_, index) => { const start = new Date(now - (6 - index) * DAY); start.setHours(0, 0, 0, 0); const end = start.getTime() + DAY; return { label: start.toLocaleDateString(undefined, { weekday: 'short' }), value: users.filter((user) => user.joinedAt && user.joinedAt.getTime() >= start.getTime() && user.joinedAt.getTime() < end).length }; }),
  };
}
