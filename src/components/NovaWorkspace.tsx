import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, BriefcaseBusiness, CalendarClock, ChevronLeft, ChevronRight, Gauge, Milestone, Sparkles, Target, TrendingUp } from 'lucide-react';
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

const CONTEXT_COLLAPSED_KEY = 'career_os_nova_context_collapsed';

export default function NovaWorkspace({ theme, opportunities, progress, timeline, certificates }: NovaWorkspaceProps) {
  const nova = useNovaWorkspace({ opportunities, progress, certificates, timeline });
  const [isContextCollapsed, setIsContextCollapsed] = useState(() => localStorage.getItem(CONTEXT_COLLAPSED_KEY) === 'true');
  const isDark = theme === 'dark';
  const recommendation = nova.recommendations[0];
  const nearestDeadline = opportunities
    .filter((opportunity) => !['Completed', 'Selected', 'Rejected'].includes(opportunity.status) && opportunity.deadline)
    .sort((left, right) => left.deadline.localeCompare(right.deadline))[0];

  useEffect(() => { localStorage.setItem(CONTEXT_COLLAPSED_KEY, String(isContextCollapsed)); }, [isContextCollapsed]);

  return (
    <div className="mx-auto flex h-full max-w-[1600px] min-h-0 flex-col gap-4 pb-2">
      <header className={`flex shrink-0 items-center justify-between gap-4 rounded-2xl border px-4 py-3 sm:px-5 ${isDark ? 'border-slate-800 bg-slate-900/65' : 'border-slate-200 bg-white/85'}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300"><BrainCircuit className="h-4 w-4" /> Nova AI Workspace</div>
          <p className={`mt-1 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Career reasoning, planning, and action in one focused conversation.</p>
        </div>
        <div className={`hidden shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] sm:flex ${isDark ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}><span className="h-2 w-2 rounded-full bg-emerald-400" />{nova.analysisLabel}</div>
      </header>

      <div className={`grid min-h-0 flex-1 gap-4 transition-[grid-template-columns] duration-200 ${isContextCollapsed ? 'xl:grid-cols-[minmax(0,1fr)_44px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
        <section className={`min-h-[640px] overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white/85'}`} aria-label="Nova conversation workspace">
          <AIAssistant theme={theme} opportunities={opportunities} progress={progress} timeline={timeline} variant="workspace" />
        </section>

        <aside className={`relative hidden min-h-0 overflow-hidden rounded-2xl border xl:block ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/85'}`} aria-label="Career context">
          <button type="button" onClick={() => setIsContextCollapsed((value) => !value)} aria-label={isContextCollapsed ? 'Expand career context' : 'Collapse career context'} aria-expanded={!isContextCollapsed} className="absolute right-2 top-2 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            {isContextCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {!isContextCollapsed && <div className="h-full overflow-y-auto p-4 pt-14">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400" /><h2 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Career context</h2></div>
            <div className="space-y-3">
              <ContextCard icon={Target} label="Today's priority" value={recommendation?.title ?? 'Add career data to receive a priority'} detail={recommendation?.reasoning} isDark={isDark} />
              <ContextCard icon={CalendarClock} label="Nearest deadline" value={nearestDeadline ? `${nearestDeadline.title} - ${nearestDeadline.deadline}` : 'No active deadline'} detail={nearestDeadline?.organization} isDark={isDark} />
              <ContextCard icon={BriefcaseBusiness} label="Active opportunities" value={String(nova.careerSummary.activeOpportunities)} detail="Tracked in your career pipeline" isDark={isDark} />
              <ContextCard icon={Gauge} label="Career signal" value={nova.analysisLabel} detail={recommendation ? `${Math.round(recommendation.confidence * 100)}% recommendation confidence` : 'Add data to improve guidance'} isDark={isDark} />
              <ContextCard icon={Milestone} label="Recent journey" value={timeline[0]?.built || timeline[0]?.learned || 'No journey entry yet'} detail={timeline[0]?.date} isDark={isDark} />
              <ContextCard icon={TrendingUp} label="Practice this week" value={`${nova.careerSummary.weeklyPracticeHours.toFixed(1)} hours`} detail={`${nova.careerSummary.latestDsaQuestions} questions in latest session`} isDark={isDark} />
            </div>
          </div>}
        </aside>
      </div>
    </div>
  );
}

function ContextCard({ icon: Icon, label, value, detail, isDark }: { icon: typeof Target; label: string; value: string; detail?: string; isDark: boolean }) {
  return <motion.div whileHover={{ y: -1 }} className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/35' : 'border-slate-200 bg-slate-50/80'}`}>
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><Icon className="h-3.5 w-3.5 text-indigo-400" />{label}</div>
    <p className={`mt-2 line-clamp-2 text-sm font-semibold leading-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
    {detail && <p className={`mt-1 line-clamp-2 text-xs leading-5 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{detail}</p>}
  </motion.div>;
}
