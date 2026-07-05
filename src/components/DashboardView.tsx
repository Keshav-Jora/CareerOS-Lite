import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  Award,
  Plus,
  ArrowUpRight,
  CircleDot,
  Check,
  Sparkles,
  Zap,
  Compass,
  Lightbulb,
  Mail,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Opportunity, DailyProgress, ActivityLog, Task, Certificate, Note } from '../types';
import CareerMemory from './CareerMemory';

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

export default function DashboardView({
  theme,
  opportunities,
  progress,
  activities,
  certificates = [],
  notes = [],
  onAddOpportunityTrigger,
  onNavigateToView,
  level = 1,
  xp = 0,
  xpForCurrentLevel = 0,
  xpProgress = 0,
  streak = 0,
  userName = 'Student',
  userSchool = 'Not Set',
}: DashboardViewProps) {
  // Collapsible Secondary Widgets toggle for Mobile view
  const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

  // Local Today's Tasks (stored in LocalStorage or local state for simplicity)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('career_os_dashboard_tasks');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('career_os_dashboard_tasks', JSON.stringify(newTasks));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  const [newTaskText, setNewTaskText] = useState('');
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
    };
    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const handleDeleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  // Stats Counters memoized
  const {
    total,
    applied,
    interviewing,
    shortlisted,
    selected,
    rejected,
    activeOpps,
    urgentOpps,
    urgentCount,
    interviewingOpps,
    appliedOpps,
    pendingCount,
    loggedToday,
    totalHoursThisWeek,
    totalDSAThisWeek,
  } = useMemo(() => {
    const total = opportunities.length;
    const applied = opportunities.filter((o) => o.status === 'Applied').length;
    const interviewing = opportunities.filter((o) => o.status === 'Interview').length;
    const shortlisted = opportunities.filter((o) => o.status === 'Shortlisted' || o.status === 'Under Review').length;
    const selected = opportunities.filter((o) => o.status === 'Selected' || o.status === 'Completed').length;
    const rejected = opportunities.filter((o) => o.status === 'Rejected').length;

    const activeOpps = opportunities
      .filter((o) => o.status !== 'Completed' && o.status !== 'Selected' && o.status !== 'Rejected')
      .map((o) => {
        const deadlineDate = new Date(o.deadline);
        const today = new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...o, daysRemaining: diffDays };
      })
      .filter((o) => o.daysRemaining >= 0)
      .sort((a, b) => {
        const aUrgent = a.daysRemaining <= 3 ? 0 : 1;
        const bUrgent = b.daysRemaining <= 3 ? 0 : 1;
        if (aUrgent !== bUrgent) return aUrgent - bUrgent;
        return a.daysRemaining - b.daysRemaining;
      });

    const urgentOpps = activeOpps.filter((o) => o.daysRemaining <= 3);
    const urgentCount = urgentOpps.length;
    const interviewingOpps = opportunities.filter((o) => o.status === 'Interview');
    const appliedOpps = opportunities.filter((o) => o.status === 'Applied' || o.status === 'Under Review');
    const pendingCount = appliedOpps.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedToday = progress.some((p) => p.date === todayStr && p.codingHours > 0);

    const totalHoursThisWeek = progress.slice(-7).reduce((acc, curr) => acc + curr.codingHours, 0);
    const totalDSAThisWeek = progress.slice(-7).reduce((acc, curr) => acc + curr.dsaQuestions, 0);

    return {
      total,
      applied,
      interviewing,
      shortlisted,
      selected,
      rejected,
      activeOpps,
      urgentOpps,
      urgentCount,
      interviewingOpps,
      appliedOpps,
      pendingCount,
      loggedToday,
      totalHoursThisWeek,
      totalDSAThisWeek,
    };
  }, [opportunities, progress]);

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Generate Personalized Advisory/Recommendations dynamically based on actual application data
  const insights = useMemo(() => {
    const recommendations = [];

    if (urgentCount > 0) {
      const orgs = urgentOpps.map((o) => o.organization).join(', ');
      recommendations.push({
        type: 'warning' as const,
        text: `⚠️ ${urgentCount} deadline${
          urgentCount > 1 ? 's' : ''
        } closing within 3 days (${orgs}). Complete your application materials immediately!`,
        category: 'Critical Deadline',
      });
    }

    if (total === 0) {
      recommendations.push({
        type: 'warning' as const,
        text: 'Your opportunity pipeline is empty. Click "Capture Opportunity" to start tracking applications and auto-monitoring deadlines.',
        category: 'Pipeline Empty',
      });
    } else if (total < 3) {
      recommendations.push({
        type: 'info' as const,
        text: 'Expand your pipeline: Capture at least 3 active tech opportunities to build a reliable evaluation queue.',
        category: 'Pipeline',
      });
    }

    if (!loggedToday) {
      recommendations.push({
        type: 'info' as const,
        text: 'Streak Alert: You haven\'t logged coding practice today. Solve 1 DSA problem or log 30 mins to keep your consistency hot.',
        category: 'Coding Streak',
      });
    }

    if (interviewingOpps.length > 0) {
      const target = interviewingOpps[0];
      recommendations.push({
        type: 'success' as const,
        text: `Active Interview Round ongoing with ${target.organization}. Review technical notes, system design, and behavioral STAR stories.`,
        category: 'Interview Prep',
      });
    }

    if (appliedOpps.length >= 2) {
      recommendations.push({
        type: 'info' as const,
        text: `You have ${appliedOpps.length} applications awaiting response. Review follow-up email templates in Notes to send nudges.`,
        category: 'Follow-Up',
      });
    }

    if (certificates.length === 0) {
      recommendations.push({
        type: 'warning' as const,
        text: 'No certificates registered in Vault yet. Upload verified credentials or course badges to increase candidate profile score.',
        category: 'Certifications',
      });
    }

    if (recommendations.length < 2) {
      recommendations.push({
        type: 'success' as const,
        text: `All ${total} pipelines healthy! Read a technical article and document key learnings in Vault notes.`,
        category: 'Growth',
      });
    }

    return recommendations.slice(0, 2);
  }, [urgentCount, urgentOpps, total, loggedToday, interviewingOpps, appliedOpps, certificates.length]);

  // --- EMAIL SYNC PLACEHOLDER LOCAL STATE ---
  const [syncedEmails, setSyncedEmails] = useState([
    { id: '1', sender: 'Google Careers', subject: 'Application received: Software Engineer Internship 2026', type: 'Application Submitted', date: 'Today, 10:14 AM', state: 'synced' },
    { id: '2', sender: 'Adobe Talent', subject: 'Next Steps: Designing with glassmorphism technical rounds', type: 'Interview Invitation', date: 'Yesterday', state: 'pending' },
    { id: '3', sender: 'GitHub Devpost', subject: 'Submission approved for Global Hackathon!', type: 'Selected', date: '2 days ago', state: 'synced' },
    { id: '4', sender: 'University Recruiting', subject: 'Scholarship status notification update', type: 'Reminder', date: '3 days ago', state: 'synced' },
    { id: '5', sender: 'Meta Recruiting', subject: 'Status update on your application', type: 'Rejected', date: '1 week ago', state: 'synced' },
    { id: '6', sender: 'OpenAI Talent', subject: 'Congratulations! We are pleased to offer you...', type: 'Offer Received', date: '2 weeks ago', state: 'synced' },
  ]);

  const handleSyncEmail = (id: string) => {
    setSyncedEmails(prev => prev.map(e => e.id === id ? { ...e, state: 'synced' } : e));
  };

  // --- DYNAMIC INTELLIGENT ACTION CENTER GENERATOR ---
  const smartActions = useMemo(() => {
    const actions: {
      id: string;
      title: string;
      priority: 'High' | 'Medium' | 'Low';
      reason: string;
      estTime: string;
      btnText: string;
      action: () => void;
    }[] = [];

    // Priority 1: Deadlines due within 3 days
    urgentOpps.slice(0, 2).forEach((opp) => {
      actions.push({
        id: `act-urgent-${opp.id}`,
        title: `🚨 Finalize & Submit to ${opp.organization}`,
        priority: 'High',
        reason: `Deadline for ${opp.title} is ${opp.daysRemaining === 0 ? 'Today' : `in ${opp.daysRemaining} days`} (${opp.deadline}). Submit before portal closes!`,
        estTime: '15 mins',
        btnText: opp.applicationLink ? 'Open Portal' : 'Submit App',
        action: () => {
          if (opp.applicationLink) {
            window.open(opp.applicationLink, '_blank');
          } else {
            onNavigateToView('opportunities');
          }
        },
      });
    });

    // Priority 2: Empty Pipeline (0 opportunities)
    if (total === 0) {
      actions.push({
        id: 'act-add-first-opp',
        title: '🚀 Add Your First Tech Opportunity',
        priority: 'High',
        reason: 'Your pipeline currently has 0 opportunities. Add an internship, hackathon, or fellowship to activate tracking.',
        estTime: '2 mins',
        btnText: 'Add Opportunity',
        action: () => onAddOpportunityTrigger(),
      });
    }

    // Priority 3: Coding streak break or no practice logged today
    if (!loggedToday || streak === 0) {
      actions.push({
        id: 'act-streak-danger',
        title: streak === 0 ? '🔥 Start a New Coding Streak' : '⚡ Log Today\'s Coding Session',
        priority: 'High',
        reason: 'No coding hours recorded for today. Solve 1 DSA problem or log practice to maintain consistency.',
        estTime: '30 mins',
        btnText: 'Log Practice',
        action: () => onNavigateToView('progress'),
      });
    }

    // Priority 4: Active Interview Prep
    if (interviewingOpps.length > 0) {
      const soonInterview = interviewingOpps[0];
      actions.push({
        id: `act-interview-${soonInterview.id}`,
        title: `🎯 Prep for ${soonInterview.organization} Interview`,
        priority: 'High',
        reason: `Review system architecture and practice behavioral STAR questions for ${soonInterview.title}.`,
        estTime: '45 mins',
        btnText: 'Review Notes',
        action: () => onNavigateToView('notes'),
      });
    }

    // Priority 5: Pending Applications Needing Follow-up
    if (appliedOpps.length >= 1) {
      const target = appliedOpps[0];
      actions.push({
        id: `act-followup-${target.id}`,
        title: `📬 Follow up with ${target.organization}`,
        priority: 'Medium',
        reason: `Application for ${target.title} is pending review (${appliedOpps.length} pending total). Send a polite nudge.`,
        estTime: '10 mins',
        btnText: 'Get Template',
        action: () => onNavigateToView('notes'),
      });
    }

    // Priority 6: No Certificates Uploaded
    if (certificates.length === 0) {
      actions.push({
        id: 'act-cert-upload',
        title: '📜 Upload Skill Certificate',
        priority: 'Medium',
        reason: 'Zero certificates registered in Vault. Upload your latest course credentials or badges.',
        estTime: '5 mins',
        btnText: 'Upload Cert',
        action: () => onNavigateToView('certificates'),
      });
    }

    // Fallbacks if list is under 3
    if (actions.length < 3) {
      actions.push({
        id: 'act-resume-update',
        title: '📝 Update Master Resume Bullet Points',
        priority: 'Low',
        reason: 'Align recent project accomplishments and cloud certifications with target role specs.',
        estTime: '15 mins',
        btnText: 'Edit Notes',
        action: () => onNavigateToView('notes'),
      });
    }

    return actions.slice(0, 4);
  }, [urgentOpps, total, loggedToday, streak, interviewingOpps, appliedOpps, certificates.length, onNavigateToView, onAddOpportunityTrigger]);

  const statsCards = [
    {
      label: 'Opportunities',
      value: total,
      subtext: 'Aggregated list',
      icon: Briefcase,
      color: 'from-indigo-500 to-purple-500',
      glow: 'glow-blue',
    },
    {
      label: 'Applied',
      value: applied,
      subtext: 'Pending response',
      icon: Send,
      color: 'from-purple-500 to-pink-500',
      glow: 'glow-pink',
    },
    {
      label: 'Interviewing',
      value: interviewing,
      subtext: 'Active evaluation',
      icon: Loader2,
      color: 'from-pink-500 to-rose-500',
      glow: 'glow-pink',
    },
    {
      label: 'Selected',
      value: selected,
      subtext: 'Offer letters',
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-500',
      glow: 'glow-emerald',
    },
  ];

  return (
    <>
      {/* DESKTOP DASHBOARD (Hidden on screens < 768px - Frozen & Untouched) */}
      <div className="hidden md:block space-y-6 max-w-6xl mx-auto p-1">
        {/* Welcome Top Banner / Mission Control */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Level {level} Career Pathfinder</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-100">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your Career Operating System is synchronized. You have gained <span className="text-indigo-400 font-bold font-mono">{xp} total XP</span> on your road to tech dominance at <span className="text-slate-200 font-semibold">{userSchool}</span>.
            </p>

            {/* Mission Control Live Reactive Status Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {urgentCount > 0 ? (
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="h-3 w-3" /> {urgentCount} Urgent Deadline{urgentCount > 1 ? 's' : ''} (&le;3 Days)
                </span>
              ) : total > 0 ? (
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-indigo-400" /> {total} Active Pipeline Roles
                </span>
              ) : (
                <button
                  onClick={onAddOpportunityTrigger}
                  className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Pipeline Empty — Add Role
                </button>
              )}

              {!loggedToday ? (
                <button
                  onClick={() => onNavigateToView('progress')}
                  className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="h-3 w-3" /> Log Today&apos;s Practice
                </button>
              ) : (
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-400" /> Coding Logged Today
                </span>
              )}

              {pendingCount > 0 && (
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Send className="h-3 w-3" /> {pendingCount} Pending Review
                </span>
              )}

              {certificates.length === 0 && (
                <button
                  onClick={() => onNavigateToView('certificates')}
                  className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Award className="h-3 w-3 text-amber-400" /> 0 Certs Uploaded
                </button>
              )}
            </div>
          </div>

          {/* XP & Streak Widget inside Banner */}
          <div className="flex items-center gap-4 shrink-0 bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl md:w-80 w-full">
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 truncate">XP Progress</span>
                <span className="text-indigo-400 font-mono shrink-0">{xpForCurrentLevel}/1000 XP</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Gain XP by saving certificates, coding, or applying.
              </p>
            </div>
            {streak > 0 && (
              <div className="h-14 w-14 shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center">
                <span className="text-lg">🔥</span>
                <span className="text-[10px] font-bold text-amber-400">{streak} Days</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Command Center Title Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-400" />
            Command Center Dashboard
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time status metrics, core pipelines, and consistency metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('progress')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics View
          </button>
          <button
            onClick={onAddOpportunityTrigger}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md glow-blue transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Capture Opportunity
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`p-4.5 rounded-2xl border ${
                theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
              } flex flex-col justify-between h-36 relative overflow-hidden group`}
            >
              {/* Subtle background glow hover effect */}
              <div
                className={`absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-br ${card.color} opacity-5 blur-2xl group-hover:scale-150 transition-all duration-500`}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {card.label}
                </span>
                <div
                  className={`h-8 w-8 rounded-lg bg-slate-800/40 flex items-center justify-center border border-slate-700/20`}
                >
                  <Icon className="h-4 w-4 text-slate-300" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-display font-bold text-white tracking-tight">
                  {card.value}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">{card.subtext}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Smart Advisory Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 p-4 rounded-2xl border border-indigo-500/10 bg-indigo-950/10 backdrop-blur-sm"
          >
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {ins.category}
                </span>
                <span className="text-[10px] text-slate-500">System suggestion</span>
              </div>
              <p className="text-xs text-slate-350 leading-normal font-medium">
                {ins.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Left column (Deadlines & Tasks) | Right column (Weekly Progress & Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Center */}
          <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-amber-500/5 to-transparent blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/20">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Zap className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-100">Intelligent Action Center</h3>
                  <p className="text-[11px] text-slate-500">Auto-detected bottlenecks and high-impact manual task recommendations.</p>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-extrabold font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {smartActions.length} READY
              </span>
            </div>

            <div className="space-y-3">
              {smartActions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 rounded-2xl border border-slate-800/40 bg-slate-950/20 hover:bg-slate-950/45 hover:border-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        action.priority === 'High'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          : action.priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                      }`}>
                        {action.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono font-medium">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" /> Est: {action.estTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-200 mt-1">{action.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{action.reason}</p>
                  </div>
                  <button
                    onClick={action.action}
                    className="sm:self-center self-end shrink-0 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>{action.btnText}</span> <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Tasks */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-sm text-slate-200">Today&apos;s Active Missions</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                {tasks.filter((t) => t.completed).length}/{tasks.length} GOALS MET
              </span>
            </div>

            {/* Task Add form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Pin a productivity micro-goal..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shrink-0 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Pin
              </button>
            </form>

            {/* Task list */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">Clear checklist. Add an objective above.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                      task.completed
                        ? 'bg-slate-950/15 border-slate-900/40 opacity-50'
                        : theme === 'dark'
                        ? 'bg-slate-900/20 border-slate-800/40 hover:bg-slate-900/40'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                          task.completed
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : theme === 'dark'
                            ? 'border-slate-800 bg-slate-950 hover:border-slate-700'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>
                      <span
                        className={`text-xs truncate ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-medium font-mono px-1 hover:bg-slate-800/40 rounded py-0.5"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                <h3 className="font-display font-bold text-sm text-slate-200">Critical Deadlines</h3>
              </div>
              <button
                onClick={() => onNavigateToView('upcoming')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {activeOpps.length === 0 ? (
                total === 0 ? (
                  <div className="text-center py-6 px-4 bg-slate-900/20 border border-slate-800/40 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400 font-medium">No active opportunities in pipeline.</p>
                    <p className="text-[11px] text-slate-500">Capture your first opportunity to unlock auto-monitoring and deadline countdowns.</p>
                    <button
                      onClick={onAddOpportunityTrigger}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Capture Opportunity
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No upcoming active deadlines logged.</p>
                )
              ) : (
                activeOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      opp.daysRemaining <= 3
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        : theme === 'dark'
                        ? 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/50'
                        : 'bg-slate-50/40 border-slate-200/50 hover:bg-slate-50'
                    } transition-all`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {opp.daysRemaining <= 3 && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            ⚠️ DUE IN {opp.daysRemaining === 0 ? 'TODAY' : `${opp.daysRemaining} DAYS`}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            opp.priority === 'High'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : opp.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {opp.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium font-mono">
                          {opp.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-200 mt-1.5">
                        {opp.title}{' '}
                        <span className="text-slate-400 font-normal">at {opp.organization}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono ${
                            opp.daysRemaining <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-200'
                          }`}
                        >
                          {opp.daysRemaining} {opp.daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Due: {opp.deadline}</p>
                      </div>
                      <div className="w-1.5 h-8 rounded bg-slate-800">
                        <div
                          className={`h-full rounded ${
                            opp.daysRemaining <= 3
                              ? 'bg-rose-500'
                              : opp.daysRemaining <= 7
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: '100%', opacity: Math.max(0.2, 1 - opp.daysRemaining / 30) }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Career Memory Search Vault */}
          <CareerMemory
            theme={theme}
            opportunities={opportunities}
            certificates={certificates}
            notes={notes}
          />

          {/* Email Auto-Sync Pipeline (Gmail Placeholder) */}
          <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4 relative overflow-hidden`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/20">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-200">Gmail Sync Integration</h3>
                  <p className="text-[10px] text-slate-500">Continuous inbox scans for career tracking.</p>
                </div>
              </div>
              <span className="text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 font-extrabold uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            <div className="py-8 text-center space-y-2">
              <Mail className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Gmail Sync Coming Soon</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                Automatic inbox scanning and application status synchronization will be available in a future update.
              </p>
            </div>
          </div>

          {/* Weekly Summary Metrics */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-slate-200">Activity Velocity</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs text-slate-300">Coding Hours (Week)</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {totalHoursThisWeek.toFixed(1)} hrs
                </span>
              </div>
              <div className="w-full bg-slate-950/40 border border-slate-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (totalHoursThisWeek / 40) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-300">DSA Questions (Week)</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-100">{totalDSAThisWeek} q</span>
              </div>
              <div className="w-full bg-slate-950/40 border border-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (totalDSAThisWeek / 15) * 100)}%` }}
                />
              </div>

              {/* Mini streak panel */}
              <div className="pt-2">
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  !loggedToday
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/50 border-slate-800'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Current Streak
                    </span>
                    <h5 className="font-bold text-sm text-slate-100 mt-0.5">
                      {streak > 0 ? `${streak} Day${streak === 1 ? '' : 's'} Active` : '0 Days (Streak Inactive)'}
                    </h5>
                    {!loggedToday && (
                      <p className="text-[10px] text-amber-400 mt-0.5 font-medium">Log practice today to keep it hot!</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!loggedToday && (
                      <button
                        onClick={() => onNavigateToView('progress')}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-colors"
                      >
                        Log Now
                      </button>
                    )}
                    <div className="h-9 w-9 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 shrink-0">
                      <span className="text-sm font-extrabold text-amber-400">🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Audit Logs */}
          <div
            className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-indigo-400" />
                <h3 className="font-display font-bold text-sm text-slate-200">Real-Time Audit</h3>
              </div>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent entries.</p>
              ) : (
                activities.slice(0, 5).map((log) => (
                  <div key={log.id} className="relative pl-4 border-l border-slate-800 pb-1.5">
                    <div className="absolute left-[-4.5px] top-[4px] h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h5 className="text-[11px] font-semibold text-slate-300 leading-tight">
                      {log.action}
                    </h5>
                    {log.details && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* MOBILE DASHBOARD (Visible ONLY on screens < 768px) */}
      <div className="block md:hidden space-y-6 w-full max-w-xl mx-auto pb-32">
        {/* Mobile Header / Welcome Card */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Lvl {level} Pathfinder</span>
            </div>
            {streak > 0 && (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🔥 {streak}d Streak
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {userSchool} · <span className="font-mono text-indigo-400 font-bold">{xp} XP</span>
            </p>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onAddOpportunityTrigger}
              className="flex-1 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Capture Opportunity
            </button>
            <button
              type="button"
              onClick={() => onNavigateToView('progress')}
              className="py-2.5 px-3 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Log Practice
            </button>
          </div>
        </div>

        {/* 1. TODAY'S MISSION */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} w-full space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/30">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100">Today&apos;s Mission</h3>
                <p className="text-[11px] text-slate-400">Daily micro-goals & progress checklist</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg">
              {tasks.filter((t) => t.completed).length}/{tasks.length} MET
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Pin a mission goal..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Pin
            </button>
          </form>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No missions pinned for today.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-slate-950/20 border-slate-900/50 opacity-60'
                      : theme === 'dark'
                      ? 'bg-slate-900/40 border-slate-800/60'
                      : 'bg-slate-50 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                        task.completed
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : theme === 'dark'
                          ? 'border-slate-700 bg-slate-950'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-500 hover:text-rose-400 text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-800/30 cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. UPCOMING DEADLINES */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} w-full space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/30">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100">Upcoming Deadlines</h3>
                <p className="text-[11px] text-slate-400">Application countdowns & key dates</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToView('upcoming')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeOpps.length === 0 ? (
              <div className="text-center py-5 px-3 bg-slate-900/20 border border-slate-800/40 rounded-xl space-y-2">
                <p className="text-xs text-slate-400 font-medium">No upcoming deadlines logged.</p>
                <button
                  type="button"
                  onClick={onAddOpportunityTrigger}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Capture Opportunity
                </button>
              </div>
            ) : (
              activeOpps.slice(0, 4).map((opp) => (
                <div
                  key={opp.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                    opp.daysRemaining <= 3
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                      : theme === 'dark'
                      ? 'bg-slate-900/40 border-slate-800/60'
                      : 'bg-slate-50 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {opp.daysRemaining <= 3 && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          ⚠️ DUE IN {opp.daysRemaining === 0 ? 'TODAY' : `${opp.daysRemaining}d`}
                        </span>
                      )}
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {opp.priority} Priority
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${opp.daysRemaining <= 3 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {opp.daysRemaining} days left ({opp.deadline})
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{opp.title}</h4>
                    <p className="text-xs text-slate-400">{opp.organization} · <span className="font-mono text-slate-500">{opp.category}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. WAITING RESPONSES */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} w-full space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/30">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Send className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100">Waiting Responses</h3>
                <p className="text-[11px] text-slate-400">Submitted applications awaiting outcome</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg">
              {pendingCount} PENDING
            </span>
          </div>

          <div className="space-y-3">
            {appliedOpps.length === 0 && interviewingOpps.length === 0 ? (
              <div className="text-center py-5 px-3 bg-slate-900/20 border border-slate-800/40 rounded-xl space-y-1.5">
                <p className="text-xs text-slate-400 font-medium">No pending applications waiting for response.</p>
                <p className="text-[11px] text-slate-500">Apply to tech opportunities to start tracking response timelines.</p>
              </div>
            ) : (
              [...interviewingOpps, ...appliedOpps].slice(0, 4).map((opp) => (
                <div
                  key={opp.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        opp.status === 'Interview'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                      }`}>
                        {opp.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{opp.category}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-100 truncate">{opp.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{opp.organization}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToView('opportunities')}
                    className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. QUICK ACTIONS */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} w-full space-y-3`}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/30">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100">Quick Actions</h3>
              <p className="text-[11px] text-slate-400">High-impact rapid triggers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onAddOpportunityTrigger}
              className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-400 text-left space-y-1 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                <Plus className="h-4 w-4" /> Capture Role
              </div>
              <p className="text-[10px] text-slate-400">Add opportunity</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToView('progress')}
              className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-left space-y-1 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <TrendingUp className="h-4 w-4" /> Log Practice
              </div>
              <p className="text-[10px] text-slate-400">Record DSA/coding</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToView('notes')}
              className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-left space-y-1 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                <FileText className="h-4 w-4" /> STAR Stories
              </div>
              <p className="text-[10px] text-slate-400">Interview notes</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToView('certificates')}
              className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-left space-y-1 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Award className="h-4 w-4" /> Vault Certs
              </div>
              <p className="text-[10px] text-slate-400">Store credentials</p>
            </button>
          </div>
        </div>

        {/* 5. NOVA ASSISTANT */}
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/80 backdrop-blur-md w-full space-y-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-slate-100">Nova AI Co-Pilot</h3>
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>
              <p className="text-[11px] text-slate-400">Contextual career advice & STAR story builder</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Ready to prepare for upcoming deadlines or review interview strategies? Ask Nova anything about your career pipeline.
          </p>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
              className="text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full hover:bg-indigo-500/25 transition-all cursor-pointer"
            >
              ✨ Tailor Resume
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
              className="text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full hover:bg-indigo-500/25 transition-all cursor-pointer"
            >
              🎯 STAR Stories
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
              className="text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full hover:bg-indigo-500/25 transition-all cursor-pointer"
            >
              📊 Analyze Pipeline
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Bot className="h-4 w-4" /> Chat with Nova Assistant
          </button>
        </div>

        {/* SECONDARY WIDGETS COLLAPSIBLE */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSecondaryWidgets(!showSecondaryWidgets)}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-400" />
              {showSecondaryWidgets ? 'Hide Secondary Tools' : 'More Analytics & Tools'}
            </span>
            {showSecondaryWidgets ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showSecondaryWidgets && (
            <div className="mt-4 space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                {statsCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${
                        theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
                      } flex flex-col justify-between h-28`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                          {card.label}
                        </span>
                        <Icon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-2xl font-display font-bold text-white tracking-tight">
                          {card.value}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-0.5">{card.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Career Memory Search Vault */}
              <CareerMemory
                theme={theme}
                opportunities={opportunities}
                certificates={certificates}
                notes={notes}
              />

              {/* Gmail Sync Integration */}
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/20">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-400" />
                    <h3 className="font-display font-bold text-xs text-slate-200">Gmail Sync</h3>
                  </div>
                  <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">Coming Soon</span>
                </div>
                <div className="py-4 text-center space-y-1">
                  <p className="font-bold text-xs text-slate-300">Gmail Sync Coming Soon</p>
                  <p className="text-[10px] text-slate-500">Inbox scanning features coming in a future release.</p>
                </div>
              </div>

              {/* Weekly Velocity */}
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3`}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/20">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-display font-bold text-xs text-slate-200">Weekly Velocity</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coding Hours:</span>
                    <span className="font-bold text-slate-200">{totalHoursThisWeek.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DSA Questions:</span>
                    <span className="font-bold text-slate-200">{totalDSAThisWeek} q</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
