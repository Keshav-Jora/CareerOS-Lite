import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Milestone,
  Plus,
  X,
  BookOpen,
  Cpu,
  Send,
  Award,
  Terminal,
  Trophy,
  Calendar,
  CheckCircle,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { TimelineEntry } from '../types';

interface JourneyViewProps {
  theme: 'light' | 'dark';
  timelineEntries: TimelineEntry[];
  onAddTimelineEntry: (entry: TimelineEntry) => void;
  onDeleteTimelineEntry: (id: string) => void;
}

export default function JourneyView({
  theme,
  timelineEntries,
  onAddTimelineEntry,
  onDeleteTimelineEntry,
}: JourneyViewProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [learned, setLearned] = useState('');
  const [built, setBuilt] = useState('');
  const [appsRaw, setAppsRaw] = useState('');
  const [certsRaw, setCertsRaw] = useState('');
  const [codingPractice, setCodingPractice] = useState('');
  const [achievements, setAchievements] = useState('');
  const [failures, setFailures] = useState('');
  const [lessons, setLessons] = useState('');
  const [isMajorMilestone, setIsMajorMilestone] = useState(false);

  // Import confetti dynamically or use window/package helper
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const apps = appsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const certs = certsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newEntry: TimelineEntry = {
      id: `tl-${Date.now()}`,
      date,
      learned,
      built,
      applications: apps,
      certificates: certs,
      codingPractice,
      achievements,
      failures: failures.trim() || undefined,
      lessons: lessons.trim() || undefined,
      isMajorMilestone,
    };

    if (isMajorMilestone) {
      // Trigger interactive milestone celebrations!
      const win = window as any;
      if (typeof win.confetti === 'function') {
        win.confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }

    onAddTimelineEntry(newEntry);
    setIsOpenForm(false);

    // Reset Form
    setDate(new Date().toISOString().split('T')[0]);
    setLearned('');
    setBuilt('');
    setAppsRaw('');
    setCertsRaw('');
    setCodingPractice('');
    setAchievements('');
    setFailures('');
    setLessons('');
    setIsMajorMilestone(false);
  };

  return (
    <>
      {/* DESKTOP JOURNEY VIEW (Hidden on screens < 768px - Frozen & Untouched) */}
      <div className="hidden md:block space-y-6 max-w-4xl mx-auto p-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Professional Journey
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Build a chronological audit log of your daily milestones, learnings, and structures.
            </p>
          </div>
          <button
            onClick={() => setIsOpenForm(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md glow-blue transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Record Today&apos;s Entry
          </button>
        </div>

        {/* Journey Stats Dashboard Bar */}
        {timelineEntries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4.5 rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total Milestones</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-black text-slate-100">{timelineEntries.length}</span>
                <span className="text-[9px] text-indigo-400 font-mono font-bold">LOGGED</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Certs Earnt</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-black text-slate-100">
                  {timelineEntries.reduce((acc, curr) => acc + (curr.certificates?.length || 0), 0)}
                </span>
                <span className="text-[9px] text-amber-400 font-mono font-bold">VERIFIED</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Applications</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-black text-slate-100">
                  {timelineEntries.reduce((acc, curr) => acc + (curr.applications?.length || 0), 0)}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold">DISPATCHED</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Pivots & Lessons</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-black text-slate-100">
                  {timelineEntries.filter((t) => t.failures || t.lessons).length}
                </span>
                <span className="text-[9px] text-rose-400 font-mono font-bold">RESILIENT</span>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Animated Timeline */}
        {timelineEntries.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Milestone className="h-5 w-5 text-slate-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-200">Your Journey begins today!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Keep an active log of what you study, design, build, and earn. Your timeline entries will stack chronologically.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-28 space-y-8 before:absolute before:left-[11px] before:md:left-[108px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
            {timelineEntries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative group"
              >
                {/* Date node left rail on desktop */}
                <div className="hidden md:block absolute left-[-115px] top-1.5 w-24 text-right">
                  <span className="text-xs font-bold text-slate-200 font-mono flex items-center justify-end gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {entry.date}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block mt-0.5">
                    Log #{timelineEntries.length - idx}
                  </span>
                </div>

                {/* Timeline dot */}
                <div className={`absolute left-[-23px] md:left-[-11px] top-2 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-slate-900 border-2 z-10 transition-transform group-hover:scale-125 ${
                  entry.isMajorMilestone ? 'border-violet-500 shadow-md shadow-violet-500/40' : 'border-indigo-500'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    entry.isMajorMilestone ? 'bg-violet-400' : 'bg-indigo-400 group-hover:bg-purple-400'
                  }`} />
                </div>

                {/* Detail Card */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  entry.isMajorMilestone
                    ? 'border-violet-500/40 bg-violet-950/10 shadow-lg shadow-violet-950/25 ring-1 ring-violet-500/10'
                    : theme === 'dark'
                    ? 'glass-panel-dark'
                    : 'glass-panel-light'
                } space-y-4`}>
                  
                  {/* Visual Glow overlay for major milestone */}
                  {entry.isMajorMilestone && (
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-violet-500/10 to-transparent blur-2xl pointer-events-none" />
                  )}

                  {/* Header with date for mobile view */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 font-mono md:hidden flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {entry.date}
                      </span>
                      {entry.isMajorMilestone && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-[9px] font-bold tracking-wider uppercase animate-pulse">
                          <Sparkles className="h-2.5 w-2.5" /> MAJOR MILESTONE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteTimelineEntry(entry.id)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 uppercase font-mono px-1 py-0.5 hover:bg-slate-800/20 rounded relative z-10"
                    >
                      Delete log
                    </button>
                  </div>

                  {/* Content grid */}
                  <div className="space-y-3.5 text-xs text-slate-300 relative z-10">
                    {/* What I Learned */}
                    {entry.learned && (
                      <div className="flex gap-2.5 items-start">
                        <div className="h-5.5 w-5.5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                          <BookOpen className="h-3 w-3 text-indigo-400" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Learned</h4>
                          <p className="leading-relaxed">{entry.learned}</p>
                        </div>
                      </div>
                    )}

                    {/* What I Built */}
                    {entry.built && (
                      <div className="flex gap-2.5 items-start">
                        <div className="h-5.5 w-5.5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <Cpu className="h-3 w-3 text-emerald-400" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Built</h4>
                          <p className="leading-relaxed text-emerald-100">{entry.built}</p>
                        </div>
                      </div>
                    )}

                    {/* Coding Practice */}
                    {entry.codingPractice && (
                      <div className="flex gap-2.5 items-start">
                        <div className="h-5.5 w-5.5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                          <Terminal className="h-3 w-3 text-indigo-400" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Algorithms & Practice</h4>
                          <p className="leading-relaxed font-mono text-[11px]">{entry.codingPractice}</p>
                        </div>
                      </div>
                    )}

                    {/* Badges row for Applications & Certificates */}
                    {((entry.applications && entry.applications.length > 0) || (entry.certificates && entry.certificates.length > 0)) && (
                      <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/20">
                        {/* Applications submitted */}
                        {entry.applications && entry.applications.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1">
                              <Send className="h-3 w-3" /> Submitted Apps
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.applications.map((app, appIdx) => (
                                <span key={appIdx} className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/30 text-[10px] text-slate-300 rounded font-medium">
                                  {app}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Certificates earned */}
                        {entry.certificates && entry.certificates.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1">
                              <Award className="h-3 w-3" /> Earned Certs
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.certificates.map((c, certIdx) => (
                                <span key={certIdx} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 rounded font-bold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Setbacks and Rejections Failure logs */}
                    {entry.failures && (
                      <div className="pt-2.5 border-t border-slate-800/15">
                        <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-[9px] text-rose-400 tracking-wider uppercase">Setback Logged:</span>
                            <p className="text-slate-300 text-xs">{entry.failures}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resiliency Lesson logs */}
                    {entry.lessons && (
                      <div className="pt-1">
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-[9px] text-amber-400 tracking-wider uppercase">Resiliency Pivot Lesson:</span>
                            <p className="text-slate-300 text-xs">{entry.lessons}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {entry.achievements && (
                      <div className="pt-2 border-t border-slate-800/20">
                        <div className="p-2.5 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                          <span className="font-bold text-[11px] text-amber-400 tracking-wide uppercase mr-1">Achievement:</span>
                          <p className="font-medium text-slate-200">{entry.achievements}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE JOURNEY VIEW (Visible ONLY on screens < 768px) */}
      <div className="block md:hidden space-y-6 w-full max-w-xl mx-auto pb-32">
        {/* Mobile Header Card */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <Milestone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-slate-100">Professional Journey</h1>
                <p className="text-[11px] text-slate-400">Daily milestones, learnings & progress audit</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenForm(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Record Today&apos;s Entry
          </button>
        </div>

        {/* Mobile Stats Dashboard Grid */}
        {timelineEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} space-y-1`}>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Milestones</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-bold text-white">{timelineEntries.length}</span>
                <span className="text-[9px] text-indigo-400 font-mono font-bold">LOGGED</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} space-y-1`}>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Certs Earned</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-bold text-white">
                  {timelineEntries.reduce((acc, curr) => acc + (curr.certificates?.length || 0), 0)}
                </span>
                <span className="text-[9px] text-amber-400 font-mono font-bold">VERIFIED</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} space-y-1`}>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Applications</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-bold text-white">
                  {timelineEntries.reduce((acc, curr) => acc + (curr.applications?.length || 0), 0)}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold">DISPATCHED</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} space-y-1`}>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Pivots & Lessons</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-display font-bold text-white">
                  {timelineEntries.filter((t) => t.failures || t.lessons).length}
                </span>
                <span className="text-[9px] text-rose-400 font-mono font-bold">RESILIENT</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Vertical Stacked Timeline Cards (Increased spacing & high readability) */}
        {timelineEntries.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3`}>
            <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto">
              <Milestone className="h-6 w-6 text-slate-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-200">Your Journey begins today!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Keep an active log of what you study, design, build, and earn. Entries stack vertically in chronological order.
            </p>
            <button
              type="button"
              onClick={() => setIsOpenForm(true)}
              className="py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Log First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {timelineEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  entry.isMajorMilestone
                    ? 'border-violet-500/50 bg-gradient-to-br from-violet-950/30 via-slate-900/90 to-purple-950/20 shadow-xl ring-1 ring-violet-500/20'
                    : theme === 'dark'
                    ? 'glass-card-dark'
                    : 'glass-card-light'
                } space-y-4`}
              >
                {/* Visual Glow overlay for major milestone */}
                {entry.isMajorMilestone && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-violet-500/15 to-transparent blur-2xl pointer-events-none" />
                )}

                {/* Mobile Card Top Row: Date, Milestone Badge, Log Number & Touch Delete */}
                <div className="space-y-2.5 border-b border-slate-800/40 pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-200 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" /> {entry.date}
                      </span>

                      {entry.isMajorMilestone && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                          <Sparkles className="h-3 w-3 text-amber-300" /> MAJOR MILESTONE
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      Log #{timelineEntries.length - idx}
                    </span>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => onDeleteTimelineEntry(entry.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
                    >
                      Delete log
                    </button>
                  </div>
                </div>

                {/* Mobile Content Sections (Vertically stacked, clear typography, comfortable padding) */}
                <div className="space-y-3.5">
                  {/* Learned */}
                  {entry.learned && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-indigo-500/15 flex items-center justify-center shrink-0 border border-indigo-500/25 text-indigo-400">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Learned</h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-8">{entry.learned}</p>
                    </div>
                  )}

                  {/* Built */}
                  {entry.built && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/25 text-emerald-400">
                          <Cpu className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Built</h4>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium leading-relaxed pl-8">{entry.built}</p>
                    </div>
                  )}

                  {/* Algorithms & Coding Practice */}
                  {entry.codingPractice && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-indigo-500/15 flex items-center justify-center shrink-0 border border-indigo-500/25 text-indigo-400">
                          <Terminal className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Algorithms & Practice</h4>
                      </div>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed pl-8">{entry.codingPractice}</p>
                    </div>
                  )}

                  {/* Submitted Applications */}
                  {entry.applications && entry.applications.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <Send className="h-3.5 w-3.5 text-indigo-400" /> Submitted Applications
                      </div>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {entry.applications.map((app, appIdx) => (
                          <span
                            key={appIdx}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700/60 text-xs text-slate-200 rounded-lg font-medium"
                          >
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earned Certificates */}
                  {entry.certificates && entry.certificates.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <Award className="h-3.5 w-3.5 text-amber-400" /> Earned Certificates
                      </div>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {entry.certificates.map((c, certIdx) => (
                          <span
                            key={certIdx}
                            className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 rounded-lg font-bold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {entry.achievements && (
                    <div className="p-3.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <Trophy className="h-4 w-4 text-amber-400" /> Achievement Logged
                      </div>
                      <p className="text-xs font-semibold text-slate-100 leading-relaxed">{entry.achievements}</p>
                    </div>
                  )}

                  {/* Setbacks / Rejections */}
                  {entry.failures && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4 text-rose-400" /> Setback Logged
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{entry.failures}</p>
                    </div>
                  )}

                  {/* Resiliency Lesson */}
                  {entry.lessons && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <Sparkles className="h-4 w-4 text-amber-400" /> Resiliency Pivot Lesson
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{entry.lessons}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ENTRY FORM MODAL DIALOG (Shared) */}
      <AnimatePresence>
        {isOpenForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpenForm(false)}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 border-slate-800 text-slate-100'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              } backdrop-blur-md z-10 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Milestone className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-display font-bold text-lg">Log Daily Achievements</h3>
                </div>
                <button
                  onClick={() => setIsOpenForm(false)}
                  className={`p-1.5 rounded-lg hover:bg-slate-800/30 transition-all ${
                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Journal Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  />
                </div>

                {/* What I learned */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    📚 What I Learned
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Explored React Concurrent mode, learned Trie structures..."
                    value={learned}
                    onChange={(e) => setLearned(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 focus:border-indigo-500/50'
                    }`}
                  />
                </div>

                {/* What I built */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    🛠️ What I Built
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Structured the main dashboard layout, configured Express backend endpoints..."
                    value={built}
                    onChange={(e) => setBuilt(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 focus:border-indigo-500/50'
                    }`}
                  />
                </div>

                {/* Coding Practice */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    💻 Coding Practice / DSA Log
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 DSA questions on LeetCode (sliding window focus)"
                    value={codingPractice}
                    onChange={(e) => setCodingPractice(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 focus:border-indigo-500/50'
                    }`}
                  />
                </div>

                {/* Applications submitted & Certificates earned (Comma separated lists) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      💼 Applications Submitted
                    </label>
                    <input
                      type="text"
                      placeholder="Google, Adobe (comma-separated)"
                      value={appsRaw}
                      onChange={(e) => setAppsRaw(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 focus:border-indigo-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      🏆 Certificates Earned
                    </label>
                    <input
                      type="text"
                      placeholder="AWS Cloud Practitioner (comma-separated)"
                      value={certsRaw}
                      onChange={(e) => setCertsRaw(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 focus:border-indigo-500/50'
                      }`}
                    />
                  </div>
                </div>

                {/* Achievements */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    ⭐ Achievements / Milestones
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14-day streak, hackathon finalist award..."
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 focus:border-indigo-500/50'
                    }`}
                  />
                </div>

                {/* Setbacks and Failures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      💔 Setbacks / Rejections <span className="text-[9px] text-slate-500 capitalize">(optional)</span>
                    </label>
                    <textarea
                      placeholder="e.g., Netflix rejection, AWS prep failure..."
                      value={failures}
                      onChange={(e) => setFailures(e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 focus:border-indigo-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      💡 Lessons Learned <span className="text-[9px] text-slate-500 capitalize">(optional)</span>
                    </label>
                    <textarea
                      placeholder="e.g., practice latency bounds, review DP paradigms..."
                      value={lessons}
                      onChange={(e) => setLessons(e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 focus:border-indigo-500/50'
                      }`}
                    />
                  </div>
                </div>

                {/* Major Milestone Switch */}
                <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200">Major Career Milestone</span>
                    <p className="text-[10px] text-slate-400">Highlight this entry as a pivotal progression log.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMajorMilestone}
                    onChange={(e) => setIsMajorMilestone(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-800 rounded"
                  />
                </div>

                {/* Footer */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpenForm(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all glow-blue"
                  >
                    Log Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Journey Stats Dashboard Bar */}
      {timelineEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4.5 rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total Milestones</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-black text-slate-100">{timelineEntries.length}</span>
              <span className="text-[9px] text-indigo-400 font-mono font-bold">LOGGED</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Certs Earnt</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-black text-slate-100">
                {timelineEntries.reduce((acc, curr) => acc + (curr.certificates?.length || 0), 0)}
              </span>
              <span className="text-[9px] text-amber-400 font-mono font-bold">VERIFIED</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Applications</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-black text-slate-100">
                {timelineEntries.reduce((acc, curr) => acc + (curr.applications?.length || 0), 0)}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-bold">DISPATCHED</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Pivots & Lessons</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-black text-slate-100">
                {timelineEntries.filter((t) => t.failures || t.lessons).length}
              </span>
              <span className="text-[9px] text-rose-400 font-mono font-bold">RESILIENT</span>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Animated Timeline */}
      {timelineEntries.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Milestone className="h-5 w-5 text-slate-500" />
          </div>
          <h4 className="font-bold text-sm text-slate-200">Your Journey begins today!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Keep an active log of what you study, design, build, and earn. Your timeline entries will stack chronologically.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-28 space-y-8 before:absolute before:left-[11px] before:md:left-[108px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
          {timelineEntries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Date node left rail on desktop */}
              <div className="hidden md:block absolute left-[-115px] top-1.5 w-24 text-right">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center justify-end gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {entry.date}
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase block mt-0.5">
                  Log #{timelineEntries.length - idx}
                </span>
              </div>

              {/* Timeline dot */}
              <div className={`absolute left-[-23px] md:left-[-11px] top-2 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-slate-900 border-2 z-10 transition-transform group-hover:scale-125 ${
                entry.isMajorMilestone ? 'border-violet-500 shadow-md shadow-violet-500/40' : 'border-indigo-500'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  entry.isMajorMilestone ? 'bg-violet-400' : 'bg-indigo-400 group-hover:bg-purple-400'
                }`} />
              </div>

              {/* Detail Card */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                entry.isMajorMilestone
                  ? 'border-violet-500/40 bg-violet-950/10 shadow-lg shadow-violet-950/25 ring-1 ring-violet-500/10'
                  : theme === 'dark'
                  ? 'glass-panel-dark'
                  : 'glass-panel-light'
              } space-y-4`}>
                
                {/* Visual Glow overlay for major milestone */}
                {entry.isMajorMilestone && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-violet-500/10 to-transparent blur-2xl pointer-events-none" />
                )}

                {/* Header with date for mobile view */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 font-mono md:hidden flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {entry.date}
                    </span>
                    {entry.isMajorMilestone && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-[9px] font-bold tracking-wider uppercase animate-pulse">
                        <Sparkles className="h-2.5 w-2.5" /> MAJOR MILESTONE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteTimelineEntry(entry.id)}
                    className="text-[10px] text-slate-500 hover:text-rose-400 uppercase font-mono px-1 py-0.5 hover:bg-slate-800/20 rounded relative z-10"
                  >
                    Delete log
                  </button>
                </div>

                {/* Content grid */}
                <div className="space-y-3.5 text-xs text-slate-300 relative z-10">
                  {/* What I Learned */}
                  {entry.learned && (
                    <div className="flex gap-2.5 items-start">
                      <div className="h-5.5 w-5.5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <BookOpen className="h-3 w-3 text-indigo-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Learned</h4>
                        <p className="leading-relaxed">{entry.learned}</p>
                      </div>
                    </div>
                  )}

                  {/* What I Built */}
                  {entry.built && (
                    <div className="flex gap-2.5 items-start">
                      <div className="h-5.5 w-5.5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <Cpu className="h-3 w-3 text-emerald-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Built</h4>
                        <p className="leading-relaxed text-emerald-100">{entry.built}</p>
                      </div>
                    </div>
                  )}

                  {/* Coding Practice */}
                  {entry.codingPractice && (
                    <div className="flex gap-2.5 items-start">
                      <div className="h-5.5 w-5.5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <Terminal className="h-3 w-3 text-indigo-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">Algorithms & Practice</h4>
                        <p className="leading-relaxed font-mono text-[11px]">{entry.codingPractice}</p>
                      </div>
                    </div>
                  )}

                  {/* Badges row for Applications & Certificates */}
                  {((entry.applications && entry.applications.length > 0) || (entry.certificates && entry.certificates.length > 0)) && (
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/20">
                      {/* Applications submitted */}
                      {entry.applications && entry.applications.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1">
                            <Send className="h-3 w-3" /> Submitted Apps
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.applications.map((app, appIdx) => (
                              <span key={appIdx} className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/30 text-[10px] text-slate-300 rounded font-medium">
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certificates earned */}
                      {entry.certificates && entry.certificates.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1">
                            <Award className="h-3 w-3" /> Earned Certs
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.certificates.map((c, certIdx) => (
                              <span key={certIdx} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 rounded font-bold">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Setbacks and Rejections Failure logs */}
                  {entry.failures && (
                    <div className="pt-2.5 border-t border-slate-800/15">
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[9px] text-rose-400 tracking-wider uppercase">Setback Logged:</span>
                          <p className="text-slate-300 text-xs">{entry.failures}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resiliency Lesson logs */}
                  {entry.lessons && (
                    <div className="pt-1">
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[9px] text-amber-400 tracking-wider uppercase">Resiliency Pivot Lesson:</span>
                          <p className="text-slate-300 text-xs">{entry.lessons}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {entry.achievements && (
                    <div className="pt-2 border-t border-slate-800/20">
                      <div className="p-2.5 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-[11px] text-amber-400 tracking-wide uppercase mr-1">Achievement:</span>
                        <p className="font-medium text-slate-200">{entry.achievements}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
