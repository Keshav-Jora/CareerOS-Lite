import { motion } from 'motion/react';
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileText,
  Milestone,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { Certificate, DailyProgress, Opportunity, TimelineEntry } from '../types';
import { useNovaWorkspace } from '../hooks/useNovaWorkspace';
import AIAssistant from './AIAssistant';

interface NovaWorkspaceProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timeline: TimelineEntry[];
  certificates: Certificate[];
  userName?: string;
  onNavigateToView: (view: string) => void;
}

const navigationCards = [
  { label: 'Opportunities', description: 'Review your active pipeline', icon: BriefcaseBusiness, destination: 'opportunities' },
  { label: 'Journey', description: 'Capture progress and projects', icon: Milestone, destination: 'journey' },
  { label: 'Progress', description: 'Log practice and momentum', icon: TrendingUp, destination: 'progress' },
  { label: 'Notes', description: 'Open your working knowledge', icon: FileText, destination: 'notes' },
] as const;

export default function NovaWorkspace({
  theme,
  opportunities,
  progress,
  timeline,
  certificates,
  userName = 'Student',
  onNavigateToView,
}: NovaWorkspaceProps) {
  const nova = useNovaWorkspace({ opportunities, progress, certificates });
  const primaryAction = nova.actionForRecommendation(nova.topRecommendation);
  const isDark = theme === 'dark';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
            <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
            AI Workspace
          </div>
          <h1 className={`mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Think through your career with Nova.
          </h1>
          <p className={`mt-3 max-w-2xl text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Explore your current direction, understand the reasoning behind each priority, and turn insight into focused action.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-medium lg:self-auto ${
          isDark ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
        }`}>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {nova.analysisLabel}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Current career summary">
        {[
          { label: 'Active opportunities', value: nova.careerSummary.activeOpportunities, icon: BriefcaseBusiness },
          { label: 'Deadlines watched', value: nova.watchedDeadlines, icon: CalendarClock },
          { label: 'Practice this week', value: `${nova.careerSummary.weeklyPracticeHours.toFixed(1)}h`, icon: TrendingUp },
          { label: 'Latest DSA session', value: nova.careerSummary.latestDsaQuestions, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/85'}`}>
              <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              <p className={`mt-4 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.value}</p>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.label}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)]">
        <div className="space-y-6">
          <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/85'}`} aria-labelledby="nova-priority-title">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Primary recommendation
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                {Math.round(nova.topRecommendation.confidence * 100)}% confidence
              </span>
            </div>
            <h2 id="nova-priority-title" className={`mt-4 font-display text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {nova.topRecommendation.title}
            </h2>
            <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{nova.topRecommendation.description}</p>
            <button
              type="button"
              onClick={() => onNavigateToView(primaryAction.destination)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>

          <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/85'}`} aria-labelledby="nova-reasoning-title">
            <h2 id="nova-reasoning-title" className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Why Nova recommends this</h2>
            <p className={`mt-4 whitespace-pre-line text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{nova.topExplanation}</p>
          </section>

          <section aria-labelledby="nova-navigation-title">
            <h2 id="nova-navigation-title" className={`mb-3 px-1 font-display text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Continue exploring</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {navigationCards.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    type="button"
                    key={item.label}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigateToView(item.destination)}
                    className={`group flex items-center gap-3 rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isDark ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' : 'border-slate-200 bg-white/85 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                      <span className={`mt-0.5 block text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.description}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>

        <section className={`min-h-[600px] overflow-hidden rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white/85'}`} aria-label="Nova conversation workspace">
          <AIAssistant theme={theme} opportunities={opportunities} progress={progress} timeline={timeline} variant="workspace" />
        </section>
      </div>
    </div>
  );
}
