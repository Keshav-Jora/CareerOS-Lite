import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarClock,
  AlertTriangle,
  ExternalLink,
  Calendar as CalendarIcon,
  Hourglass,
  ArrowUpRight,
  CheckSquare,
  Sparkles,
  Info,
  CheckCircle2,
  Bell,
  BellOff,
  Award,
  Milestone,
  BookOpen,
  Clock,
  X,
} from 'lucide-react';
import { Opportunity, TimelineEntry, Certificate, DailyProgress } from '../types';

interface UpcomingViewProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  timelineEntries?: TimelineEntry[];
  certificates?: Certificate[];
  progressData?: DailyProgress[];
  onNavigateToView: (view: string) => void;
}

export default function UpcomingView({
  theme,
  opportunities,
  timelineEntries = [],
  certificates = [],
  progressData = [],
  onNavigateToView,
}: UpcomingViewProps) {
  const today = new Date();

  // Browser Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [reminders, setReminders] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('career_os_opp_reminders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Selected calendar day for detail drawer
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in your browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      new Notification('CareerOS Lite Reminders Active', {
        body: 'Deadline notifications enabled! You will receive reminders for upcoming deadlines.',
        icon: '/favicon.ico',
      });
    }
  };

  const handleSetReminder = (oppId: string, reminderType: string) => {
    const updated = { ...reminders, [oppId]: reminderType };
    setReminders(updated);
    localStorage.setItem('career_os_opp_reminders', JSON.stringify(updated));
  };

  const toggleChecklist = (oppId: string, item: string) => {
    setCheckedItems((prev) => {
      const active = prev[oppId] || [];
      const updated = active.includes(item)
        ? active.filter((i) => i !== item)
        : [...active, item];
      return { ...prev, [oppId]: updated };
    });
  };

  // Filter active deadlines
  const upcomingDeadlines = opportunities
    .filter((o) => o.status !== 'Completed' && o.status !== 'Selected' && o.status !== 'Rejected')
    .map((o) => {
      const deadlineDate = new Date(o.deadline);
      const timeDiff = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return { ...o, daysRemaining };
    })
    .filter((o) => o.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Trigger browser notifications for urgent deadlines (<= 1 day)
  useEffect(() => {
    if (notificationPermission === 'granted') {
      const urgent = upcomingDeadlines.filter((o) => o.daysRemaining <= 1);
      if (urgent.length > 0) {
        urgent.forEach((opp) => {
          const notifiedKey = `notified_${opp.id}_${opp.deadline}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            new Notification(`${opp.title} - Deadline Warning`, {
              body: `${opp.organization} application deadline is ${
                opp.daysRemaining === 0 ? 'today!' : 'tomorrow!'
              } Submit your materials soon.`,
            });
            sessionStorage.setItem(notifiedKey, 'true');
          }
        });
      }
    }
  }, [notificationPermission, upcomingDeadlines]);

  // Stats
  const urgentCount = upcomingDeadlines.filter((o) => o.daysRemaining <= 3).length;
  const standardCount = upcomingDeadlines.filter((o) => o.daysRemaining > 3 && o.daysRemaining <= 10).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
    }
  };

  const calculateProximityPercent = (days: number) => {
    const maxDays = 30;
    const progress = Math.max(0, Math.min(100, ((maxDays - days) / maxDays) * 100));
    return parseFloat(progress.toFixed(0));
  };

  // Calculate Urgency Score out of 99
  const calculateUrgencyScore = (days: number, priority: string, status: string) => {
    let score = 95 - days * 2.8;
    if (priority === 'High') score += 12;
    if (priority === 'Low') score -= 12;
    if (status === 'Saved' || status === 'Planned') score += 10;
    if (status === 'Interview') score += 15;
    return Math.max(5, Math.min(99, Math.round(score)));
  };

  // Generate checklist guidelines dynamically based on opportunity category
  const getChecklistGuidelines = (category: string) => {
    switch (category) {
      case 'Internship':
        return ['Tailor Resume to JD', 'Solve 3 tagged LeetCode Qs', 'Draft Cover Letter draft', 'Outreach to Recruiter'];
      case 'Hackathon':
        return ['Form Hackathon Team', 'Brainstorm architectural stack', 'Setup Github repository', 'Refine presentation pitch'];
      case 'Certification':
        return ['Review syllabus bounds', 'Take full mock examination', 'Prepare cheatsheet details', 'Schedule testing window'];
      case 'Fellowship':
      case 'Scholarship':
        return ['Draft personal essay', 'Secure recommender logs', 'Verify GPA certification', 'Submit application package'];
      default:
        return ['Confirm application criteria', 'Prepare review documents', 'Draft reference list', 'Submit final ledger'];
    }
  };

  // Calendar setup
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });

  // Get items scheduled for a specific calendar day
  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const opps = opportunities.filter((o) => {
      if (!o.deadline) return false;
      const d = new Date(o.deadline);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    const certs = certificates.filter((c) => {
      if (!c.date) return false;
      const d = new Date(c.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    const timeline = timelineEntries.filter((t) => {
      if (!t.date) return false;
      return t.date.startsWith(dateStr) || new Date(t.date).getDate() === day;
    });

    const study = progressData.filter((p) => {
      if (!p.date) return false;
      return p.date.startsWith(dateStr) || new Date(p.date).getDate() === day;
    });

    return { opps, certs, timeline, study };
  };

  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : null;
  const hasSelectedDayItems = selectedDayItems
    ? selectedDayItems.opps.length > 0 ||
      selectedDayItems.certs.length > 0 ||
      selectedDayItems.timeline.length > 0 ||
      selectedDayItems.study.length > 0
    : false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-1 pb-32 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-400" />
            Calendar &amp; Deadline Radar
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track internship deadlines, hackathons, certifications, and daily study milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Permission Toggle */}
          <button
            type="button"
            onClick={requestNotificationPermission}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              notificationPermission === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
            }`}
          >
            {notificationPermission === 'granted' ? (
              <>
                <Bell className="h-3.5 w-3.5 text-emerald-400" /> Reminders Active
              </>
            ) : (
              <>
                <BellOff className="h-3.5 w-3.5" /> Enable Notifications
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateToView('opportunities')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Manage Ledger <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4.5 rounded-2xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-4`}>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Urgent (≤ 3 Days)</h5>
            <span className="text-2xl font-display font-extrabold text-white mt-1 block">{urgentCount} opps</span>
          </div>
        </div>

        <div className={`p-4.5 rounded-2xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-4`}>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Hourglass className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Upcoming (4-10 Days)</h5>
            <span className="text-2xl font-display font-extrabold text-white mt-1 block">{standardCount} opps</span>
          </div>
        </div>

        <div className={`p-4.5 rounded-2xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-4`}>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <CalendarClock className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Total Active Tracking</h5>
            <span className="text-2xl font-display font-extrabold text-white mt-1 block">{upcomingDeadlines.length} items</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Monthly Calendar Dot-Map & Selected Day Inspector) | Right Column (Deadlines list) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Monthly Calendar */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <div className="pb-4 mb-4 border-b border-slate-800/30 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200">Interactive Calendar</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{monthName} {year}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-mono uppercase font-bold">
                Synced Live
              </span>
            </div>

            {/* Calendar Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, dIdx) => (
                <span key={dIdx} className="text-[10px] font-bold text-slate-500 uppercase py-1">{dayName}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayIndex }).map((_, bIdx) => (
                <div key={`blank-${bIdx}`} className="h-9 rounded bg-transparent" />
              ))}

              {Array.from({ length: totalDays }).map((_, dIdx) => {
                const day = dIdx + 1;
                const isToday = day === today.getDate();
                const isSelected = selectedDay === day;
                const items = getItemsForDay(day);
                const hasDeadlines = items.opps.length > 0;
                const hasCertificates = items.certs.length > 0;
                const hasMilestones = items.timeline.length > 0;
                const hasActivity = items.study.length > 0;

                return (
                  <button
                    type="button"
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                        : isToday
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                        : theme === 'dark'
                        ? 'bg-slate-900/40 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px]">{day}</span>
                    <div className="flex items-center gap-0.5 absolute bottom-1">
                      {hasDeadlines && <span className="h-1 w-1 rounded-full bg-rose-400" />}
                      {hasCertificates && <span className="h-1 w-1 rounded-full bg-amber-400" />}
                      {hasMilestones && <span className="h-1 w-1 rounded-full bg-purple-400" />}
                      {hasActivity && <span className="h-1 w-1 rounded-full bg-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/20 flex flex-wrap justify-between items-center text-[9px] text-slate-500 gap-2">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Deadline</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Cert</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Journey</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Study</span>
            </div>
          </div>

          {/* Selected Date Detail Card */}
          <AnimatePresence mode="wait">
            {selectedDay !== null && (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/20">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-indigo-400" />
                    <h3 className="font-display font-bold text-xs text-slate-200">
                      Scheduled for {monthName} {selectedDay}, {year}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {!hasSelectedDayItems ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No events scheduled for this date.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {/* Opportunities */}
                    {selectedDayItems?.opps.map((o) => (
                      <div key={o.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-rose-300">{o.title}</p>
                          <p className="text-[10px] text-slate-400">{o.organization} • {o.category}</p>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                          DEADLINE
                        </span>
                      </div>
                    ))}

                    {/* Certificates */}
                    {selectedDayItems?.certs.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-amber-300">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.platform} • {c.category}</p>
                        </div>
                        <Award className="h-4 w-4 text-amber-400" />
                      </div>
                    ))}

                    {/* Timeline */}
                    {selectedDayItems?.timeline.map((t) => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-purple-300">{t.learned || t.built || 'Journey Milestone'}</p>
                          <p className="text-[10px] text-slate-400">{t.achievements || t.codingPractice || 'Milestone'}</p>
                        </div>
                        <Milestone className="h-4 w-4 text-purple-400" />
                      </div>
                    ))}

                    {/* Daily Progress */}
                    {selectedDayItems?.study.map((p) => (
                      <div key={p.date} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-emerald-300">Logged {p.codingHours} hrs coding, {p.dsaQuestions} DSA Qs</p>
                          <p className="text-[10px] text-slate-400">Daily Study Log</p>
                        </div>
                        <BookOpen className="h-4 w-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Countdown Timers & Preparations List */}
        <div className="lg:col-span-2 space-y-4">
          {upcomingDeadlines.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CalendarClock className="h-5 w-5 text-slate-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-200">No active impending deadlines</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Capture new opportunities in the Opportunity Ledger to track deadlines automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingDeadlines.map((opp, idx) => {
                const proximity = calculateProximityPercent(opp.daysRemaining);
                const isUrgent = opp.daysRemaining <= 3;
                const urgencyScore = calculateUrgencyScore(opp.daysRemaining, opp.priority, opp.status);
                const checklist = getChecklistGuidelines(opp.category);
                const completedCount = (checkedItems[opp.id] || []).length;
                const currentReminder = reminders[opp.id] || '3 days before';

                return (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-2xl border relative overflow-hidden ${
                      theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
                    } flex flex-col gap-4 hover:border-slate-700/80 transition-all`}
                  >
                    {/* Red warning border flash for urgent items */}
                    {isUrgent && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                    )}

                    {/* Metadata & Info */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(opp.priority)}`}>
                            {opp.priority} Priority
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{opp.category}</span>
                        </div>
                        <h3 className="font-display font-bold text-base text-slate-150 leading-snug truncate">
                          {opp.title} <span className="text-slate-400 font-normal">at {opp.organization}</span>
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5 font-mono">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> Target Date: {opp.deadline}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-slate-500" /> Stage: {opp.status}
                          </span>
                        </div>
                      </div>

                      {/* Urgency Score Meter */}
                      <div className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-base font-display font-black leading-none ${
                              urgencyScore >= 80 ? 'text-rose-400' : urgencyScore >= 50 ? 'text-amber-400' : 'text-slate-200'
                            }`}>{urgencyScore}</span>
                            <span className="text-[9px] text-slate-500">/99</span>
                          </div>
                          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Urgency Score</span>
                        </div>
                      </div>
                    </div>

                    {/* Proximity Slider & Days Remaining Countdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/15">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Proximity Status</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-display font-black leading-none shrink-0 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                            {opp.daysRemaining} {opp.daysRemaining === 1 ? 'DAY' : 'DAYS'} LEFT
                          </span>
                          <div className="flex-1">
                            <div className="w-full bg-slate-950/40 border border-slate-800 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${
                                  isUrgent
                                    ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-sm shadow-rose-500/50'
                                    : opp.daysRemaining <= 10
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-400'
                                }`}
                                style={{ width: `${proximity}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Reminder Setting Dropdown */}
                        <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400">
                          <Bell className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>Reminder:</span>
                          <select
                            value={currentReminder}
                            onChange={(e) => handleSetReminder(opp.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[10px] focus:outline-none"
                          >
                            <option value="7 days before">7 days before</option>
                            <option value="3 days before">3 days before</option>
                            <option value="1 day before">1 day before</option>
                            <option value="Same day">Same day</option>
                          </select>
                        </div>
                      </div>

                      {/* Interactive preparation Checklist widgets */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                          <span>Prep Checklist</span>
                          <span className="text-slate-400 font-mono">{completedCount}/{checklist.length} DONE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {checklist.map((item, idx) => {
                            const isChecked = (checkedItems[opp.id] || []).includes(item);
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => toggleChecklist(opp.id, item)}
                                className={`p-1.5 rounded-lg border text-[10px] text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isChecked
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-300 line-through'
                                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700/80 hover:text-slate-300'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0" />
                                ) : (
                                  <div className="h-3 w-3 rounded border border-slate-700 shrink-0" />
                                )}
                                <span className="truncate">{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Link Details and Action Trigger */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/15">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Info className="h-3.5 w-3.5 text-slate-500" />
                        <span>Resync state in Opportunity Ledger if target shifts.</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {opp.applicationLink && (
                          <a
                            href={opp.applicationLink}
                            target="_blank"
                            rel="noreferrer"
                            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                              theme === 'dark'
                                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                            title="Apply now"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigateToView('opportunities')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 cursor-pointer"
                        >
                          Modify Board
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
