import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  BriefcaseBusiness,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  ListTodo,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';
import type { ActivityLog, Certificate, DailyProgress, Note, Opportunity, TimelineEntry } from '../types';
import type { CanonicalCareerData, CareerMission, MissionTask } from '../types/career-data';
import { useDashboardIntelligence } from '../hooks/useDashboardIntelligence';
import { CareerStatisticsService } from '../services/data/CareerStatisticsService';

interface DashboardViewProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timelineEntries: TimelineEntry[];
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
  dailyMission?: CareerMission;
  onSaveMission: (mission: CareerMission) => void;
  onDeleteMission: (id: string) => void;
  careerSnapshot: CanonicalCareerData | null;
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
  timelineEntries,
  activities,
  certificates,
  notes,
  onAddOpportunityTrigger,
  onNavigateToView,
  userName = 'Student',
  dailyMission,
  onSaveMission,
  onDeleteMission,
  careerSnapshot,
}: DashboardViewProps) {
  const [missionComplete, setMissionComplete] = useState(false);
  const intelligence = useDashboardIntelligence({
    opportunities,
    progress,
    timelineEntries,
    activities,
    certificates,
    notes,
    userName,
  });
  const statistics = new CareerStatisticsService().fromWorkspace({ opportunities, journey: timelineEntries, certifications: certificates });
  const snapshotStatistics = careerSnapshot ? new CareerStatisticsService().fromSnapshot(careerSnapshot) : null;
  const { recommendation, featuredOpportunity } = intelligence;
  const isDark = theme === 'dark';
  const surface = isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const headingText = isDark ? 'text-white' : 'text-slate-950';
  const trendLabel = intelligence.weeklyTrend === 0
    ? 'Stable this week'
    : `${intelligence.weeklyTrend > 0 ? '↑' : '↓'} ${Math.abs(intelligence.weeklyTrend)}h this week`;

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">
      <header className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-sm font-medium ${mutedText}`}>{getGreeting()}, {userName}.</p>
          <h1 className={`mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl ${headingText}`}>Your career command center.</h1>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedText}`}>
            Keep goals, opportunities, and progress in one focused workspace. Current focus: <span className={isDark ? 'font-semibold text-indigo-300' : 'font-semibold text-indigo-600'}>{recommendation.highestPriority.title}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            AI analysis refreshed now
          </span>
          <button type="button" onClick={() => onNavigateToView('nova')} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-semibold transition hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${isDark ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
            <Search className="h-3.5 w-3.5" aria-hidden="true" /> Quick search
          </button>
        </div>
      </header>

      <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${surface}`} aria-labelledby="career-health-title">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative mx-auto grid h-44 w-44 place-items-center rounded-full p-3" style={{ background: `conic-gradient(#818cf8 ${recommendation.careerHealthScore * 3.6}deg, ${isDark ? '#1e293b' : '#e2e8f0'} 0deg)` }}>
            <div className={`grid h-full w-full place-items-center rounded-full ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
              <div className="text-center"><p className={`font-display text-4xl font-bold ${headingText}`}>{recommendation.careerHealthScore}</p><p className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${mutedText}`}>of 100</p></div>
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Career health</div>
            <h2 id="career-health-title" className={`mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl ${headingText}`}>A clear picture of your momentum.</h2>
            <p className={`mt-3 max-w-xl text-sm leading-6 ${mutedText}`}>{recommendation.highestPriority.rationale}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <MetricPill label="Weekly trend" value={trendLabel} isDark={isDark} />
              <MetricPill label="Data confidence" value={`${intelligence.confidence}%`} isDark={isDark} />
              <MetricPill label="Active pipeline" value={`${statistics.activeOpportunities} opportunities`} isDark={isDark} />
            </div>
          </div>
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-indigo-400/20 bg-indigo-500/10' : 'border-indigo-100 bg-indigo-50/80'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>What changes the score</p>
            <p className={`mt-2 max-w-52 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Complete your next best action, then log the outcome to keep Nova’s view accurate.</p>
          </div>
        </div>
      </section>

      <section className={`rounded-3xl border p-6 shadow-xl shadow-indigo-950/10 sm:p-7 ${isDark ? 'border-indigo-400/20 bg-slate-900/80' : 'border-indigo-100 bg-white shadow-indigo-200/30'}`} aria-labelledby="nova-recommendation-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-400"><BrainCircuit className="h-4 w-4" aria-hidden="true" /> Nova recommendation</div>
            <h2 id="nova-recommendation-title" className={`mt-3 font-display text-2xl font-bold tracking-tight ${headingText}`}>{recommendation.highestPriority.title}</h2>
            <p className={`mt-3 text-sm leading-6 ${mutedText}`}>{recommendation.highestPriority.description}</p>
            <div className={`mt-5 border-l-2 pl-4 ${isDark ? 'border-violet-400/60' : 'border-violet-500'}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>Evidence</p>
              <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{recommendation.highestPriority.rationale}</p>
            </div>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <RecommendationMetric label="Impact" value={intelligence.expectedImpact} isDark={isDark} />
            <RecommendationMetric label="Confidence" value={`${intelligence.confidence}%`} isDark={isDark} />
            <RecommendationMetric label="Estimated time" value={intelligence.estimatedDuration} isDark={isDark} />
            <RecommendationMetric label="Priority" value={recommendation.highestPriority.priority} isDark={isDark} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <details className={`rounded-xl border px-4 py-2.5 text-sm ${isDark ? 'border-slate-700 bg-slate-950/40 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            <summary className="cursor-pointer font-semibold">Why?</summary>
            <p className={`mt-3 max-w-2xl text-sm leading-6 ${mutedText}`}>Nova prioritizes this because it is the clearest action supported by your current CareerOS data. It is not a prediction or a completed action.</p>
          </details>
          <button type="button" onClick={() => setMissionComplete((complete) => !complete)} aria-pressed={missionComplete} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${missionComplete ? 'bg-emerald-500 text-slate-950' : isDark ? 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            <Check className="h-4 w-4" aria-hidden="true" /> {missionComplete ? 'Marked done' : 'Mark done'}
          </button>
          <button type="button" onClick={() => onNavigateToView('nova')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
            Ask Nova <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DailyMissionCard theme={theme} mission={dailyMission} fallbackTitle={recommendation.todayMission.title} fallbackDescription={recommendation.todayMission.description} fallbackPriority={recommendation.todayMission.priority} fallbackDuration={intelligence.estimatedDuration} onSave={onSaveMission} onDelete={onDeleteMission} />

        <CareerSnapshot theme={theme} statistics={snapshotStatistics} progressEntries={progress.length} onNavigate={onNavigateToView} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <section className={`rounded-3xl border p-6 ${surface}`} aria-labelledby="top-opportunity-title">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-sm font-semibold text-sky-400"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Top opportunity</div><button type="button" onClick={() => onNavigateToView('opportunities')} className={`inline-flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>View all <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button></div>
          {featuredOpportunity ? <FeaturedOpportunityCard featured={featuredOpportunity} isDark={isDark} onView={() => onNavigateToView('opportunities')} /> : <EmptyOpportunityState isDark={isDark} onAdd={onAddOpportunityTrigger} />}
        </section>

        <section className={`rounded-3xl border p-6 ${surface}`} aria-labelledby="momentum-title">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><TrendingUp className="h-4 w-4" aria-hidden="true" /> Learning momentum</div>
          <h2 id="momentum-title" className={`mt-3 font-display text-xl font-bold ${headingText}`}>{intelligence.streak} day learning streak</h2>
          {progress.length > 0 ? <><p className={`mt-2 text-sm ${mutedText}`}>{intelligence.weeklyProgress}% of this week has recorded learning activity.</p><div className={`mt-5 h-3 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} aria-label={`${intelligence.weeklyProgress}% weekly learning progress`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={intelligence.weeklyProgress}><motion.div initial={{ width: 0 }} animate={{ width: `${intelligence.weeklyProgress}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" /></div><div className="mt-5 flex items-end gap-1.5" aria-label="Seven-day activity visualization">{Array.from({ length: 7 }, (_, index) => <span key={index} className={`h-10 flex-1 rounded-sm ${isDark ? 'bg-emerald-400/45' : 'bg-emerald-400/60'}`} style={{ transform: `scaleY(${0.35 + ((intelligence.weeklyProgress / 100) * ((index % 3) + 1) / 3)})`, transformOrigin: 'bottom' }} />)}</div></> : <EmptyMomentumState isDark={isDark} onLog={() => onNavigateToView('progress')} />}
        </section>
      </div>

      <section className={`rounded-3xl border p-6 ${surface}`} aria-labelledby="decision-memory-title">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-400"><Sparkles className="h-4 w-4" aria-hidden="true" /> Decision memory</div><h2 id="decision-memory-title" className={`mt-2 font-display text-lg font-bold ${headingText}`}>{recommendation.nextBestAction.title}</h2><p className={`mt-1 text-sm ${mutedText}`}>{intelligence.latestActivity ? `Latest recorded outcome: ${intelligence.latestActivity.action}` : 'Outcome tracking begins when you log progress in your Journey.'}</p></div><button type="button" onClick={() => onNavigateToView('journey')} className={`inline-flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}>Open Journey <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
      </section>

      <section aria-labelledby="quick-actions-title"><div className="mb-3 flex items-center gap-2 px-1"><ListTodo className="h-4 w-4 text-indigo-400" aria-hidden="true" /><h2 id="quick-actions-title" className={`font-display text-lg font-bold ${headingText}`}>Quick actions</h2></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map((action) => { const Icon = action.icon; const onClick = action.destination === 'opportunities' ? onAddOpportunityTrigger : () => onNavigateToView(action.destination); return <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2, ease: 'easeOut' }} key={action.label} onClick={onClick} className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${surface}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 transition group-hover:bg-indigo-500/20"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${headingText}`}>{action.label}</span><span className={`mt-0.5 block text-xs ${mutedText}`}>{action.description}</span></span><ChevronRight className={`h-4 w-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} aria-hidden="true" /></motion.button>; })}</div></section>

      <div className={`flex items-center gap-2 px-1 text-xs ${isDark ? 'text-slate-600' : 'text-slate-500'}`}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> This Command Center refreshes whenever your CareerOS data changes.</div>
    </div>
  );
}

function DailyMissionCard({ theme, mission, fallbackTitle, fallbackDescription, fallbackPriority, fallbackDuration, onSave, onDelete }: { theme: 'light' | 'dark'; mission?: CareerMission; fallbackTitle: string; fallbackDescription: string; fallbackPriority: string; fallbackDuration: string; onSave: (mission: CareerMission) => void; onDelete: (id: string) => void }) {
  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(mission?.title ?? 'Today’s Mission');
  const [duration, setDuration] = useState(mission?.duration ?? '45 min');
  const [priority, setPriority] = useState<NonNullable<CareerMission['priority']>>(mission?.priority ?? 'High');
  const [tasks, setTasks] = useState<MissionTask[]>(mission?.tasks ?? []);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    setTitle(mission?.title ?? 'Today’s Mission');
    setDuration(mission?.duration ?? '45 min');
    setPriority(mission?.priority ?? 'High');
    setTasks(mission?.tasks ?? []);
    setIsEditing(false);
  }, [mission]);

  if (!mission) {
    return <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm'}`} aria-labelledby="mission-title"><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-semibold text-amber-400"><Target className="h-4 w-4" aria-hidden="true" /> Today’s mission</div><h2 id="mission-title" className={`mt-2 font-display text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{fallbackTitle}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${priorityClass(fallbackPriority)}`}>{fallbackPriority}</span></div><p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{fallbackDescription}</p><div className={`mt-5 grid grid-cols-3 divide-x rounded-xl border ${isDark ? 'divide-slate-800 border-slate-800 bg-slate-950/35' : 'divide-slate-200 border-slate-200 bg-slate-50'}`}><MissionMetric label="Duration" value={fallbackDuration} /><MissionMetric label="Priority" value={fallbackPriority} /><MissionMetric label="Status" value="Open" /></div></section>;
  }

  const completed = tasks.filter((task) => task.completed).length;
  const save = (nextTasks = tasks) => {
    onSave({ ...mission, title: title.trim() || 'Today’s Mission', duration: duration.trim() || '45 min', priority, tasks: nextTasks, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  };
  const toggleTask = (id: string) => {
    const nextTasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    setTasks(nextTasks);
    onSave({ ...mission, tasks: nextTasks, updatedAt: new Date().toISOString() });
  };
  const addTask = () => {
    const label = newTask.trim();
    if (!label) return;
    setTasks((current) => [...current, { id: `mission-task-${Date.now()}`, label, completed: false }]);
    setNewTask('');
  };

  return <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm'}`} aria-labelledby="mission-title">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold text-amber-400"><Target className="h-4 w-4" aria-hidden="true" /> Today’s mission</div>{isEditing ? <input aria-label="Mission title" value={title} onChange={(event) => setTitle(event.target.value)} className={`mt-2 w-full rounded-lg border px-3 py-2 text-xl font-bold ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-950'}`} /> : <h2 id="mission-title" className={`mt-2 font-display text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{mission.title}</h2>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${priorityClass(mission.priority ?? 'High')}`}>{mission.priority ?? 'High'}</span></div>
    <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tasks.length} Tasks · {completed}/{tasks.length} Complete</p>
    <div className="mt-4 space-y-2">{tasks.map((task) => <div key={task.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${isDark ? 'border-slate-800 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}><button type="button" aria-label={`Toggle ${task.label}`} onClick={() => toggleTask(task.id)} className={`grid h-5 w-5 place-items-center rounded border ${task.completed ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600'}`}>{task.completed && <Check className="h-3.5 w-3.5" />}</button><span className={`min-w-0 flex-1 text-sm ${task.completed ? 'text-slate-500 line-through' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>{task.label}</span>{isEditing && <button type="button" aria-label={`Remove ${task.label}`} onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} className="text-xs font-semibold text-rose-400">Remove</button>}</div>)}</div>
    {isEditing && <div className="mt-4 space-y-3"><div className="flex gap-2"><input aria-label="New mission task" value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } }} placeholder="Add task" className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`} /><button type="button" onClick={addTask} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white">Add</button></div><div className="grid gap-2 sm:grid-cols-2"><input aria-label="Mission duration" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Duration" className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`} /><select aria-label="Mission priority" value={priority} onChange={(event) => setPriority(event.target.value as NonNullable<CareerMission['priority']>)} className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}><option>High</option><option>Medium</option><option>Low</option></select></div></div>}
    <div className="mt-5 grid grid-cols-3 divide-x rounded-xl border border-slate-800 bg-slate-950/35"><MissionMetric label="Duration" value={mission.duration ?? '45 min'} /><MissionMetric label="Priority" value={mission.priority ?? 'High'} /><MissionMetric label="Progress" value={`${completed}/${tasks.length}`} /></div>
    <div className="mt-4 flex gap-2">{isEditing ? <><button type="button" onClick={() => save()} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white">Save mission</button><button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold">Cancel</button></> : <><button type="button" onClick={() => setIsEditing(true)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold">Edit</button><button type="button" onClick={() => onDelete(mission.id)} className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-400">Delete</button></>}</div>
  </section>;
}

function CareerSnapshot({ theme, statistics, progressEntries, onNavigate }: { theme: 'light' | 'dark'; statistics: ReturnType<CareerStatisticsService['fromSnapshot']> | null; progressEntries: number; onNavigate: (view: string) => void }) {
  const isDark = theme === 'dark';
  const items = [
    { label: 'Opportunities', value: statistics?.opportunities ?? 0, icon: BriefcaseBusiness, destination: 'opportunities' },
    { label: 'Goals', value: statistics?.activeGoals ?? 0, icon: Target, destination: 'journey' },
    { label: 'Projects', value: statistics?.projects ?? 0, icon: FolderKanban, destination: 'journey' },
    { label: 'Certifications', value: statistics?.certifications ?? 0, icon: Award, destination: 'certificates' },
    { label: 'Progress entries', value: progressEntries, icon: TrendingUp, destination: 'progress' },
  ];
  return <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm'}`} aria-labelledby="career-snapshot-title"><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-semibold text-sky-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Career snapshot</div><h2 id="career-snapshot-title" className={`mt-2 font-display text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Your tracked career data</h2></div><span className="text-xs text-slate-400">Live repository view</span></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{items.map((item) => { const Icon = item.icon; return <button type="button" key={item.label} onClick={() => onNavigate(item.destination)} className={`min-h-24 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${isDark ? 'border-slate-800 bg-slate-950/35 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}><Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" /><p className={`mt-3 text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-950'}`}>{item.value}</p><p className="mt-1 text-[11px] font-medium leading-4 text-slate-400">{item.label}</p></button>; })}</div></section>;
}
function EmptyMomentumState({ isDark, onLog }: { isDark: boolean; onLog: () => void }) { return <div className={`mt-5 rounded-2xl border border-dashed p-5 ${isDark ? 'border-slate-700 bg-slate-950/30' : 'border-slate-300 bg-slate-50'}`}><CircleAlert className="h-5 w-5 text-emerald-400" aria-hidden="true" /><p className={`mt-3 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No progress logged this week</p><p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Log one focused session to start building a visible learning rhythm.</p><button type="button" onClick={onLog} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">Log practice <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>; }
function MetricPill({ label, value, isDark }: { label: string; value: string; isDark: boolean }) { return <span className={`rounded-xl border px-3 py-2 text-xs ${isDark ? 'border-slate-700 bg-slate-950/30 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}><span className={`mr-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</span><span className="font-semibold">{value}</span></span>; }
function RecommendationMetric({ label, value, isDark }: { label: string; value: string; isDark: boolean }) { return <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}><p className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p><p className={`mt-1 text-sm font-semibold capitalize ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{value}</p></div>; }
function MissionMetric({ label, value }: { label: string; value: string }) { return <div className="min-w-0 px-3 py-3 text-center"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-300">{value}</p></div>; }
function FeaturedOpportunityCard({ featured, isDark, onView }: { featured: ReturnType<typeof useDashboardIntelligence>['featuredOpportunity'] & {}; isDark: boolean; onView: () => void }) { if (!featured) return null; const { opportunity, reason, matchScore, requiredSkills, daysUntilDeadline } = featured; return <div className="mt-5"><h2 id="top-opportunity-title" className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{opportunity.title}</h2><p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{opportunity.organization} · {reason}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><RecommendationMetric label="Deadline" value={daysUntilDeadline === null ? 'Not set' : daysUntilDeadline === 0 ? 'Today' : `${daysUntilDeadline} days`} isDark={isDark} /><RecommendationMetric label="Match score" value={matchScore === null ? 'Needs skills' : `${matchScore}%`} isDark={isDark} /><RecommendationMetric label="Required skills" value={requiredSkills.length ? `${requiredSkills.length} listed` : 'Not listed'} isDark={isDark} /></div>{requiredSkills.length > 0 && <p className={`mt-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Skills: {requiredSkills.join(' · ')}</p>}<button type="button" onClick={onView} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">View details <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>; }
function EmptyOpportunityState({ isDark, onAdd }: { isDark: boolean; onAdd: () => void }) { return <div className={`mt-5 rounded-2xl border border-dashed p-5 ${isDark ? 'border-slate-700 bg-slate-950/30' : 'border-slate-300 bg-slate-50'}`}><CircleAlert className="h-5 w-5 text-amber-400" aria-hidden="true" /><p className={`mt-3 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No featured opportunity yet</p><p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Capture an opportunity to let CareerOS prioritize deadlines and fit.</p><button type="button" onClick={onAdd} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">Capture opportunity <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>; }
function priorityClass(priority: string): string { return priority === 'critical' || priority === 'high' ? 'bg-rose-500/10 text-rose-300' : priority === 'medium' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'; }
function getGreeting(): string { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'; }
