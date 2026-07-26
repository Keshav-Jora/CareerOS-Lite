import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { SessionManager } from '../services/auth/SessionManager';
import { AnalyticsDashboardRepository, type AdminUserRecord, type AnalyticsRecord } from './AnalyticsDashboardRepository';
import { deriveAnalyticsMetrics, deriveRecentActivities, deriveUserSummaries, type AdminUserSummary } from './analyticsMetrics';
import { RecentActivityTable } from './RecentActivityTable';
import { UserDirectory, type UserRange } from './UserDirectory';
import { UserProfileDrawer } from './UserProfileDrawer';

const adminEmails = new Set((import.meta.env.VITE_ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
const repository = new AnalyticsDashboardRepository();
const chartTooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0' };
const duration = (milliseconds: number) => milliseconds ? `${Math.round(milliseconds / 1000)}s` : '—';

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</article>;
}

export default function AdminConsole() {
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<UserRange>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const metrics = useMemo(() => deriveAnalyticsMetrics(records, users), [records, users]);
  const summaries = useMemo(() => deriveUserSummaries(records, users), [records, users]);
  const activities = useMemo(() => deriveRecentActivities(records), [records]);
  const visibleUsers = useMemo(() => filterUsers(summaries, search, range), [summaries, search, range]);

  useEffect(() => new SessionManager().observe((user) => setAccess(user?.email && adminEmails.has(user.email.toLowerCase()) ? 'allowed' : 'denied')), []);
  useEffect(() => { if (access === 'denied') window.location.replace('/'); }, [access]);
  const loadAnalytics = async () => { setLoading(true); setError(null); try { const snapshot = await repository.fetchSnapshot(); setRecords(snapshot.records); setUsers(snapshot.users); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load analytics.'); } finally { setLoading(false); } };
  useEffect(() => { if (access === 'allowed') void loadAnalytics(); }, [access]);

  if (access !== 'allowed') return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-400"><ShieldCheck className="mr-2 h-5 w-5" />Verifying owner access…</main>;
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-indigo-300"><ShieldCheck className="h-4 w-4" />Owner console</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">CareerOS Admin</h1><p className="mt-2 text-sm text-slate-400">Users, sessions, and product activity.</p></div><button type="button" onClick={() => void loadAnalytics()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></header>
    {error && <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
    <section aria-label="User metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"><MetricCard label="Total users" value={metrics.overview.totalUsers} /><MetricCard label="New users today" value={metrics.ownerOverview.newUsersToday} /><MetricCard label="Returning users" value={metrics.userInsights.returningUsers} /><MetricCard label="DAU" value={metrics.overview.dau} /><MetricCard label="WAU" value={metrics.overview.wau} /><MetricCard label="MAU" value={metrics.overview.mau} /><MetricCard label="Avg. session" value={duration(metrics.overview.averageSessionMs)} /><MetricCard label="Online now" value={metrics.ownerOverview.currentOnlineUsers} detail="Active browser sessions" /></section>
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-300" /><div><h2 className="text-base font-semibold text-slate-100">User growth</h2><p className="text-sm text-slate-400">New user profiles over the last seven days.</p></div></div><div className="mt-5 h-64"><ResponsiveContainer><LineChart data={metrics.userGrowth}><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></section>
    <section className="mt-8"><RecentActivityTable activities={activities} users={summaries} /></section>
    <section className="mt-8"><UserDirectory users={visibleUsers} query={search} range={range} onQueryChange={setSearch} onRangeChange={setRange} onSelect={setSelectedUser} /></section>
    {!loading && !records.length && !users.length && <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center text-sm text-slate-400">No analytics users or events have been recorded yet.</p>}
  </div><UserProfileDrawer user={selectedUser} activities={activities} onClose={() => setSelectedUser(null)} /></main>;
}

function filterUsers(users: AdminUserSummary[], search: string, range: UserRange): AdminUserSummary[] {
  const normalized = search.trim().toLowerCase();
  const now = Date.now();
  const start = range === 'today' ? now - 86_400_000 : range === 'week' ? now - 7 * 86_400_000 : range === 'month' ? now - 30 * 86_400_000 : 0;
  return users.filter((user) => (!normalized || `${user.displayName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalized)) && (range === 'all' || Boolean(user.joinedAt && user.joinedAt.getTime() >= start)));
}
