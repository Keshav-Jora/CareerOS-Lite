import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BarChart3, Clock3, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { SessionManager } from '../services/auth/SessionManager';
import { AnalyticsDashboardRepository, type AnalyticsRecord } from './AnalyticsDashboardRepository';
import { deriveAnalyticsMetrics } from './analyticsMetrics';

const adminEmails = new Set((import.meta.env.VITE_ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
const repository = new AnalyticsDashboardRepository();

const chartTooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0' };
const formatDuration = (milliseconds: number) => milliseconds ? `${Math.round(milliseconds / 1000)}s` : '—';

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
  </article>;
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
    <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
    <div className="mt-5 h-64">{children}</div>
  </section>;
}

export default function AdminConsole() {
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metrics = useMemo(() => deriveAnalyticsMetrics(records), [records]);

  useEffect(() => new SessionManager().observe((user) => {
    const allowed = Boolean(user?.email && adminEmails.has(user.email.toLowerCase()));
    setAccess(allowed ? 'allowed' : 'denied');
  }), []);

  useEffect(() => {
    if (access !== 'denied') return;
    window.location.replace('/');
  }, [access]);

  const loadAnalytics = async () => {
    setLoading(true); setError(null);
    try { setRecords(await repository.fetchRecent()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load analytics.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (access === 'allowed') void loadAnalytics(); }, [access]);

  if (access !== 'allowed') return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-400"><ShieldCheck className="mr-2 h-5 w-5" />Verifying owner access…</main>;

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-indigo-300"><ShieldCheck className="h-4 w-4" />Owner console</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">CareerOS Analytics</h1>
          <p className="mt-2 text-sm text-slate-400">Product activity from the past 30 days.</p>
        </div>
        <button type="button" onClick={() => void loadAnalytics()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60" aria-label="Refresh analytics">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </header>

      {error && <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

      <section aria-labelledby="overview-heading"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-300" /><h2 id="overview-heading" className="text-lg font-semibold">Overview</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <MetricCard label="Total users" value={metrics.overview.totalUsers} /><MetricCard label="DAU" value={metrics.overview.dau} /><MetricCard label="WAU" value={metrics.overview.wau} /><MetricCard label="MAU" value={metrics.overview.mau} /><MetricCard label="Avg. session" value={formatDuration(metrics.overview.averageSessionMs)} /><MetricCard label="AI conversations" value={metrics.overview.conversations} /><MetricCard label="Feedback score" value={metrics.overview.feedbackScore === null ? '—' : `${metrics.overview.feedbackScore}%`} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="ai-heading"><h2 id="ai-heading" className="text-lg font-semibold">AI analytics</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Provider usage"><ResponsiveContainer><BarChart data={metrics.providerUsage}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="#818cf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Average response time (ms)"><ResponsiveContainer><BarChart data={metrics.responseTimes}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      </div><div className="mt-4 grid gap-4 sm:grid-cols-3"><MetricCard label="Success rate" value={metrics.providerSuccessRate === null ? '—' : `${metrics.providerSuccessRate}%`} /><MetricCard label="Provider failures" value={metrics.providerFailures} /><MetricCard label="Fallbacks" value={metrics.fallbackCount} /></div>
      {metrics.intentDistribution.length > 0 && <div className="mt-4"><ChartCard title="Intent distribution"><ResponsiveContainer><BarChart data={metrics.intentDistribution}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="#a78bfa" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div>}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2"><ChartCard title="Feature usage"><ResponsiveContainer><BarChart data={metrics.featureUsage}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Errors"><ResponsiveContainer><BarChart data={metrics.errors}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="#fb7185" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2"><div><div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-300" /><h2 className="text-lg font-semibold">User insights</h2></div><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Returning users" value={metrics.userInsights.returningUsers} /><MetricCard label="Avg. conversations" value={metrics.userInsights.averageConversations} /><MetricCard label="7-day retention" value={metrics.userInsights.retention === null ? '—' : `${metrics.userInsights.retention}%`} /></div><div className="mt-4"><MetricCard label="New users" value={metrics.userInsights.newUsers} /></div></div><ChartCard title="Feedback trend"><ResponsiveContainer><LineChart data={metrics.feedbackTrend}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} /><YAxis stroke="#64748b" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartCard></section>
      {!loading && records.length === 0 && <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center text-sm text-slate-400"><Clock3 className="mr-2 inline h-4 w-4" />No analytics events were recorded in the last 30 days.</p>}
    </div>
  </main>;
}
