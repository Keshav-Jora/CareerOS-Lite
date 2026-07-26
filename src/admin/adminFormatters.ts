import type { AnalyticsUserStatus } from '../analytics/EventTypes';

const MINUTE = 60_000;

export function shortUid(uid: string): string { return uid.length > 10 ? `${uid.slice(0, 4)}…${uid.slice(-4)}` : uid; }
export function userLabel(user: { displayName: string | null; email: string | null; uid: string }): string { return user.displayName || user.email || shortUid(user.uid); }
export function providerLabel(providerId: string): string {
  const labels: Record<string, string> = { 'google.com': 'Google', 'github.com': 'GitHub', password: 'Email' };
  return labels[providerId] ?? (providerId && providerId !== 'unknown' ? providerId.replace('.com', '') : 'Unavailable');
}
export function relativeTime(value: Date | null, now = Date.now()): string {
  if (!value) return '—';
  const elapsed = Math.max(0, now - value.getTime());
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < 60 * MINUTE) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < 24 * 60 * MINUTE) return `${Math.floor(elapsed / (60 * MINUTE))} hr ago`;
  return `${Math.floor(elapsed / (24 * 60 * MINUTE))}d ago`;
}
export function presence(lastSeenAt: Date | null, now = Date.now()): AnalyticsUserStatus | 'idle' {
  if (!lastSeenAt) return 'offline';
  const elapsed = now - lastSeenAt.getTime();
  if (elapsed <= 2 * MINUTE) return 'online';
  if (elapsed <= 15 * MINUTE) return 'idle';
  return 'offline';
}
