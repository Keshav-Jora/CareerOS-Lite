import { Github, Mail, RefreshCw, Unplug } from 'lucide-react';
import { ConnectionManager } from '../services/integrations/connections/ConnectionManager';
import type { ConnectionProvider, ExternalConnection } from '../services/integrations/contracts/Connection';

interface ConnectionsViewProps {
  theme: 'light' | 'dark';
  connections: ExternalConnection[];
  focusProvider?: ConnectionProvider;
  onRefresh: () => void;
}

const manager = new ConnectionManager();

export default function ConnectionsView({ theme, connections, focusProvider, onRefresh }: ConnectionsViewProps) {
  const isDark = theme === 'dark';
  const connectionFor = (provider: ConnectionProvider) => connections.find((connection) => connection.provider === provider) ?? manager.getConnection(provider);
  const update = (action: 'connect' | 'disconnect' | 'sync', provider: ConnectionProvider) => {
    manager[action](provider);
    onRefresh();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">CareerOS integrations</p>
          <h1 className={`mt-1 font-display text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Connections</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Connection settings are local framework placeholders. CareerOS has not requested access to Gmail or GitHub.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConnectionCard provider="gmail" connection={connectionFor('gmail')} focused={focusProvider === 'gmail'} theme={theme} onAction={update} />
        <ConnectionCard provider="github" connection={connectionFor('github')} focused={focusProvider === 'github'} theme={theme} onAction={update} />
      </div>
    </div>
  );
}

function ConnectionCard({ provider, connection, focused, theme, onAction }: { provider: ConnectionProvider; connection: ExternalConnection; focused: boolean; theme: 'light' | 'dark'; onAction: (action: 'connect' | 'disconnect' | 'sync', provider: ConnectionProvider) => void }) {
  const isDark = theme === 'dark';
  const Icon = provider === 'gmail' ? Mail : Github;
  const label = provider === 'gmail' ? 'Gmail' : 'GitHub';
  const accountLabel = provider === 'gmail' ? 'Account' : 'Username';
  const countLabel = provider === 'gmail' ? 'Career Events' : 'Repositories';
  const count = provider === 'gmail' ? connection.careerEventCount : connection.repositoryCount;
  const status = connection.status === 'connected' ? 'Connected' : 'Disconnected';
  const lastSync = connection.lastSync ? new Date(connection.lastSync).toLocaleString() : 'Never';
  const surface = isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <section className={`rounded-3xl border p-6 ${surface} ${focused ? 'ring-2 ring-indigo-500/50' : ''}`} aria-labelledby={`${provider}-connection-title`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-950 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 id={`${provider}-connection-title`} className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{label}</h2><p className={`mt-0.5 text-xs ${muted}`}>Provider connection framework</p></div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connection.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>{status}</span>
      </div>
      <dl className={`mt-6 divide-y rounded-2xl border ${isDark ? 'divide-slate-800 border-slate-800 bg-slate-950/30' : 'divide-slate-200 border-slate-200 bg-slate-50'}`}>
        <ConnectionDetail label={accountLabel} value={connection.account ?? 'Not Connected'} />
        <ConnectionDetail label="Last Sync" value={lastSync} />
        <ConnectionDetail label={countLabel} value={String(count)} />
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAction('connect', provider)} className="rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">Connect</button>
        <button type="button" onClick={() => onAction('sync', provider)} disabled={connection.status !== 'connected'} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-45 ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><RefreshCw className="h-4 w-4" aria-hidden="true" />Sync</button>
        <button type="button" onClick={() => onAction('disconnect', provider)} disabled={connection.status !== 'connected'} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-45 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Unplug className="h-4 w-4" aria-hidden="true" />Disconnect</button>
      </div>
    </section>
  );
}

function ConnectionDetail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="truncate text-sm font-semibold text-slate-200">{value}</dd></div>;
}
