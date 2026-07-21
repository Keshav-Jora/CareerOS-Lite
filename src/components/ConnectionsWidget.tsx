import { Github, Mail, Plug } from 'lucide-react';
import type { ExternalConnection } from '../services/integrations/contracts/Connection';

export default function ConnectionsWidget({ theme, connections, onOpen }: { theme: 'light' | 'dark'; connections: ExternalConnection[]; onOpen: () => void }) {
  const isDark = theme === 'dark';
  const status = (provider: 'gmail' | 'github') => connections.find((connection) => connection.provider === provider)?.status === 'connected' ? 'Connected' : 'Disconnected';
  return <button type="button" onClick={onOpen} className={`w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm'}`}><span className="flex items-center gap-2 text-sm font-semibold text-indigo-400"><Plug className="h-4 w-4" aria-hidden="true" />Connections</span><div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><span className="flex items-center justify-between"><span className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" />Gmail</span><span className="text-xs text-slate-400">{status('gmail')}</span></span><span className="flex items-center justify-between"><span className="flex items-center gap-2"><Github className="h-4 w-4" aria-hidden="true" />GitHub</span><span className="text-xs text-slate-400">{status('github')}</span></span></div></button>;
}
