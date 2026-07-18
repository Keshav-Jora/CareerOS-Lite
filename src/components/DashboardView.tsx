import { motion } from 'motion/react';
import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flame,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { ActivityLog, Certificate, DailyProgress, Note, Opportunity } from '../types';
import { useCommandCenter } from '../hooks/useCommandCenter';

interface DashboardViewProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  progress: DailyProgress[];
  activities: ActivityLog[];
  certificates: Certificate[];
  notes: Note[];
  onAddOpportunityTrigger: () => void;
  onNavigateToView: (view: string) => void;
  level?: number;
  xp?: number;
  xpForCurrentLevel?: number;
  xpProgress?: number;
  streak?: number;
  userName?: string;
  userSchool?: string;
}

const quickActions = [
  { label: 'Capture opportunity', description: 'Add a role to your pipeline', icon: Plus, destination: 'opportunities' },
  { label: 'Log practice', description: 'Record focused progress', icon: TrendingUp, destination: 'progress' },
  { label: 'Update journey', description: 'Document what you built', icon: Target, destination: 'journey' },
  { label: 'Open notes', description: 'Review your working memory', icon: FileText, destination: 'notes' },
] as const;

export default function DashboardView({
  theme,
  opportunities,
  progress,
  certificates = [],
  onAddOpportunityTrigger,
  onNavigateToView,
  userName = 'Student',
}: DashboardViewProps) {
  const commandCenter = useCommandCenter({ opportunities, progress, certificates });
  const topAction = commandCenter.actionForRecommendation(commandCenter.topRecommendation);
  const isDark = theme === 'dark';
  const greeting = getGreeting();
  const estimatedImpact = commandCenter.topRecommendation.priority === 'high'
    ? 'High impact'
    : commandCenter.topRecommendation.priority === 'medium'
      ? 'Meaningful impact'
      : 'Steady impact';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          isDark ? 'border-slate-800 bg-slate-900/70 text-slate-400' : 'border-slate-200 bg-white/80 text-slate-600'
        }`}>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {commandCenter.analysisLabel}
        </div>
        <div className={`flex items-center gap-3 font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <span>{commandCenter.monitoredOpportunities} opportunities monitored</span>
          <span className="hidden sm:inline">{commandCenter.watchedDeadlines} deadlines watched</span>
        </div>
      </div>

      <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10 ${
        isDark ? 'border-slate-800 bg-slate-900/65 shadow-2xl shadow-slate-950/20' : 'border-slate-200 bg-white/85 shadow-xl shadow-slate-200/40'
      }`} aria-labelledby="command-center-title">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-72 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
            <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
            AI Brief
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{greeting}, {userName}.</p>
          <h1 id="command-center-title" className={`mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Your next best move is clear.
          </h1>
          <p className={`mt-4 max-w-2xl text-base leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            I analyzed your current career context and found one action with the strongest near-term leverage.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 font-medium text-indigo-300">
              Confidence {Math.round(commandCenter.topRecommendation.confidence * 100)}%
            </span>
            <span className={`rounded-lg border px-3 py-2 font-medium ${
              isDark ? 'border-slate-700 bg-slate-950/40 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>{estimatedImpact}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <section className={`rounded-3xl border p-6 sm:p-7 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/85'
        }`} aria-labelledby="top-priority-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Flame className="h-4 w-4" aria-hidden="true" />
                Top priority
              </div>
              <h2 id="top-priority-title" className={`mt-3 font-display text-2xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>{commandCenter.topRecommendation.title}</h2>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
              commandCenter.topRecommendation.priority === 'high'
                ? 'bg-rose-500/10 text-rose-300'
                : 'bg-indigo-500/10 text-indigo-300'
            }`}>{commandCenter.topRecommendation.priority}</span>
          </div>

          <div className={`mt-5 border-l-2 pl-4 ${isDark ? 'border-indigo-400/50 text-slate-400' : 'border-indigo-500/50 text-slate-600'}`}>
            <p className="text-sm font-medium">Why it matters</p>
            <p className="mt-1 text-sm leading-6">{commandCenter.topRecommendation.description}</p>
          </div>

          <details className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            isDark ? 'border-slate-800 bg-slate-950/35 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            <summary className="cursor-pointer font-medium text-slate-300 marker:text-indigo-400">See AI reasoning</summary>
            <p className="mt-3 whitespace-pre-line leading-6">{commandCenter.topExplanation}</p>
          </details>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <Sparkles className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              Estimated impact: <span className="font-semibold text-indigo-300">{estimatedImpact}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToView(topAction.destination)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {topAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className={`rounded-3xl border p-6 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/85'
        }`} aria-labelledby="today-plan-title">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            <h2 id="today-plan-title" className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Today's plan</h2>
          </div>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Three focused moves, ordered by impact.</p>
          <ol className="mt-5 space-y-4">
            {commandCenter.todayPlan.map((recommendation, index) => {
              const action = commandCenter.actionForRecommendation(recommendation);
              return (
                <li key={recommendation.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-300">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => onNavigateToView(action.destination)}
                    className={`group min-w-0 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <span className="block font-medium">{recommendation.title}</span>
                    <span className={`mt-0.5 block text-xs leading-5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{recommendation.description}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-3 flex items-center gap-2 px-1">
          <ListTodo className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <h2 id="quick-actions-title" className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const onClick = action.destination === 'opportunities' ? onAddOpportunityTrigger : () => onNavigateToView(action.destination);
            return (
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                key={action.label}
                onClick={onClick}
                className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isDark ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900' : 'border-slate-200 bg-white/85 hover:border-slate-300'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 transition group-hover:bg-indigo-500/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{action.label}</span>
                  <span className={`mt-0.5 block text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{action.description}</span>
                </span>
                <ChevronRight className={`h-4 w-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>
      </section>

      <div className={`flex items-center gap-2 px-1 text-xs ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        Everything is up to date. Your Command Center will refresh as your career data changes.
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
