import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Clock,
  Plus,
  Terminal,
  Activity,
  Award,
  BookOpen,
  Flame,
  LayoutGrid,
  Calendar,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { DailyProgress } from '../types';

interface ProgressViewProps {
  theme: 'light' | 'dark';
  progressData: DailyProgress[];
  onUpdateDailyProgress: (progress: DailyProgress) => void;
}

export default function ProgressView({
  theme,
  progressData,
  onUpdateDailyProgress,
}: ProgressViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Retrieve today's existing log or default empty
  const todayLog = progressData.find((p) => p.date === todayStr) || {
    date: todayStr,
    dsaQuestions: 0,
    codingHours: 0,
    webDevHours: 0,
    pythonHours: 0,
    applicationsCount: 0,
    readingMinutes: 0,
    projectsHours: 0,
  };

  // Metric states for today's logs
  const [dsa, setDsa] = useState(todayLog.dsaQuestions);
  const [hours, setHours] = useState(todayLog.codingHours);
  const [webDev, setWebDev] = useState(todayLog.webDevHours);
  const [python, setPython] = useState(todayLog.pythonHours);
  const [apps, setApps] = useState(todayLog.applicationsCount);
  const [reading, setReading] = useState(todayLog.readingMinutes);
  const [projects, setProjects] = useState(todayLog.projectsHours);

  const [isLoggedToday, setIsLoggedToday] = useState(
    Boolean(progressData.find((p) => p.date === todayStr))
  );

  // Sync state when progressData or todayStr changes (e.g. after data reset or reload)
  useEffect(() => {
    const log = progressData.find((p) => p.date === todayStr);
    if (log) {
      setDsa(log.dsaQuestions);
      setHours(log.codingHours);
      setWebDev(log.webDevHours);
      setPython(log.pythonHours);
      setApps(log.applicationsCount);
      setReading(log.readingMinutes);
      setProjects(log.projectsHours);
      setIsLoggedToday(true);
    } else {
      setDsa(0);
      setHours(0);
      setWebDev(0);
      setPython(0);
      setApps(0);
      setReading(0);
      setProjects(0);
      setIsLoggedToday(false);
    }
  }, [progressData, todayStr]);

  // Mobile Chart Navigation State
  const [mobileChartTab, setMobileChartTab] = useState<'bar' | 'radar' | 'heatmap' | 'area'>('bar');

  const handleNextChartTab = () => {
    const ids: Array<'bar' | 'radar' | 'heatmap' | 'area'> = ['bar', 'radar', 'heatmap', 'area'];
    const currentIdx = ids.indexOf(mobileChartTab);
    setMobileChartTab(ids[(currentIdx + 1) % ids.length]);
  };

  const handlePrevChartTab = () => {
    const ids: Array<'bar' | 'radar' | 'heatmap' | 'area'> = ['bar', 'radar', 'heatmap', 'area'];
    const currentIdx = ids.indexOf(mobileChartTab);
    setMobileChartTab(ids[(currentIdx - 1 + ids.length) % ids.length]);
  };

  const handleSaveProgress = () => {
    const updated: DailyProgress = {
      date: todayStr,
      dsaQuestions: Number(dsa),
      codingHours: parseFloat(Number(hours).toFixed(1)),
      webDevHours: parseFloat(Number(webDev).toFixed(1)),
      pythonHours: parseFloat(Number(python).toFixed(1)),
      applicationsCount: Number(apps),
      readingMinutes: Number(reading),
      projectsHours: parseFloat(Number(projects).toFixed(1)),
    };
    onUpdateDailyProgress(updated);
    setIsLoggedToday(true);
  };

  // Streak Calculation (continuous days with codingHours > 0)
  const calculateStreak = (): number => {
    let streak = 0;
    const sorted = [...progressData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Start scanning from today/yesterday
    let currentDateToCheck = today;
    
    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].date);
      entryDate.setHours(0,0,0,0);
      
      const diffTime = currentDateToCheck.getTime() - entryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        if (sorted[i].codingHours > 0 || sorted[i].dsaQuestions > 0) {
          streak++;
          currentDateToCheck = entryDate;
        } else {
          break;
        }
      } else if (diffDays > 1) {
        // Gap in dates, streak is broken
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // Generate GitHub-style contribution heatmap data (last 12 weeks = 84 days)
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = progressData.find((p) => p.date === dateStr);
      
      // Calculate contribution level based on combination of metrics
      const coding = log?.codingHours || 0;
      const dsa = log?.dsaQuestions || 0;
      const projects = log?.projectsHours || 0;
      const totalEffort = coding + (dsa * 0.5) + projects;

      let level = 0;
      if (totalEffort > 0 && totalEffort <= 1.5) level = 1;
      else if (totalEffort > 1.5 && totalEffort <= 4) level = 2;
      else if (totalEffort > 4 && totalEffort <= 7) level = 3;
      else if (totalEffort > 7) level = 4;

      data.push({
        date: dateStr,
        level,
        log,
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Aggregate stats for Skill Radar chart calculated from stored progress data
  const totalQuestions = progressData.reduce((acc, curr) => acc + curr.dsaQuestions, 0);
  const totalHours = progressData.reduce((acc, curr) => acc + curr.codingHours, 0);
  const totalWebDev = progressData.reduce((acc, curr) => acc + curr.webDevHours, 0);
  const totalPython = progressData.reduce((acc, curr) => acc + curr.pythonHours, 0);
  const totalProjects = progressData.reduce((acc, curr) => acc + curr.projectsHours, 0);
  const totalPrep = progressData.reduce((acc, curr) => acc + curr.readingMinutes, 0) / 60;

  // Render skill competency based strictly on actual stored progress data. Renders empty when no data.
  const skillRadarData = progressData.length === 0
    ? []
    : [
        { subject: 'Algorithms (DSA)', value: Math.min(99, Math.round(totalQuestions * 6)) },
        { subject: 'Web Crafting', value: Math.min(99, Math.round(totalWebDev * 12)) },
        { subject: 'Python systems', value: Math.min(99, Math.round(totalPython * 12)) },
        { subject: 'Core Projects', value: Math.min(99, Math.round(totalProjects * 12)) },
        { subject: 'Syllabus Prep', value: Math.min(99, Math.round(totalPrep * 8)) },
      ];

  // Productivity Insights generator
  const getProductivityInsights = () => {
    const activeDays = progressData.filter(p => p.codingHours > 0 || p.dsaQuestions > 0).length;
    const consistencyIndex = progressData.length > 0 ? Math.round((activeDays / progressData.length) * 100) : 0;
    
    // Choose focus area
    let primaryFocus = 'None';
    if (progressData.length > 0) {
      primaryFocus = 'Fullstack Web Crafting';
      if (totalPython > totalWebDev && totalPython > totalQuestions) {
        primaryFocus = 'Python System Architectures';
      } else if (totalQuestions * 0.5 > totalWebDev && totalQuestions * 0.5 > totalProjects) {
        primaryFocus = 'Algorithmic DSA Competency';
      } else if (totalProjects > totalWebDev) {
        primaryFocus = 'Core Product Engineering';
      }
    }

    return {
      consistencyIndex,
      primaryFocus,
      velocityStatus: streak >= 10 ? 'Supercharged' : streak > 0 ? 'Ascending' : 'Dormant',
    };
  };

  const insights = getProductivityInsights();

  // Chart Data preparation: Weekly (last 7 logs) from stored user data
  const weeklyChartData = progressData.slice(-7).map((p) => ({
    name: new Date(p.date + 'T00:00:00').toLocaleDateString([], { weekday: 'short' }),
    hours: p.codingHours,
    dsa: p.dsaQuestions,
    projects: p.projectsHours,
  }));

  // Monthly Cumulative (last 14 days) from stored user data
  const monthlyChartData = progressData.slice(-14).map((p) => ({
    name: new Date(p.date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }),
    hours: p.codingHours,
    learning: p.readingMinutes / 10, // Scale for line visual
  }));

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border text-xs ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } backdrop-blur-md shadow-xl font-mono`}>
          <p className="font-bold mb-1.5">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="flex justify-between gap-4 py-0.5">
              <span className="text-slate-400">{item.name}:</span>
              <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* DESKTOP PROGRESS VIEW (Hidden on screens < 768px - Frozen & Untouched) */}
      <div className="hidden md:block space-y-6 max-w-6xl mx-auto p-1">
        {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
          Velocity Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Measure daily execution, log milestones, and visualize performance metrics.
        </p>
      </div>

      {/* Grid: Daily Logger vs Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Logger Panel (Left span 2) */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
          <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-800/20">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-slate-200">
                {isLoggedToday ? "Review Today's Activity Log" : 'Record Daily Work Effort'}
              </h3>
            </div>
            {isLoggedToday && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                ✓ Recorded
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Coding Hours */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Coding Hours
                </span>
                <span className="font-mono text-indigo-400 font-bold">{hours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* DSA Questions */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-purple-400" /> DSA Questions
                </span>
                <span className="font-mono text-purple-400 font-bold">{dsa} problems</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={dsa}
                onChange={(e) => setDsa(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Web Dev Hours */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-400" /> Web Development
                </span>
                <span className="font-mono text-emerald-400 font-bold">{webDev} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={webDev}
                onChange={(e) => setWebDev(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Python Hours */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-400" /> Python Programming
                </span>
                <span className="font-mono text-amber-400 font-bold">{python} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={python}
                onChange={(e) => setPython(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Reading minutes */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Reading / Prep Time
                </span>
                <span className="font-mono text-indigo-400 font-bold">{reading} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={reading}
                onChange={(e) => setReading(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Projects Hours */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-rose-400" /> Core Projects Time
                </span>
                <span className="font-mono text-rose-400 font-bold">{projects} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={projects}
                onChange={(e) => setProjects(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveProgress}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md glow-blue transition-all"
            >
              {isLoggedToday ? 'Update Today\'s Entry' : 'Lock Daily Progress'}
            </button>
          </div>
        </div>

        {/* Streak & Cumulative Stats (Right span 1) */}
        <div className="space-y-4">
          {/* Streak Flame Container */}
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} text-center flex flex-col justify-center items-center h-52 relative overflow-hidden`}>
            {/* Soft backdrop radial glow */}
            <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="h-16 w-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-xl glow-purple mb-3"
            >
              <Flame className="h-10 w-10 text-amber-500 animate-pulse" />
            </motion.div>
            <h4 className="font-display font-extrabold text-3xl text-white tracking-tight">{streak} Days</h4>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold font-mono">Continuous Streak</p>
          </div>

          {/* Combined Quick Statistics */}
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} grid grid-cols-2 gap-4 h-[120px]`}>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Questions</span>
              <h5 className="font-display font-bold text-2xl text-white mt-1">{totalQuestions} <span className="text-xs text-slate-500 font-normal">solved</span></h5>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Hours logged</span>
              <h5 className="font-display font-bold text-2xl text-white mt-1">{totalHours.toFixed(1)} <span className="text-xs text-slate-500 font-normal">hrs</span></h5>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-Style Contribution Heatmap Container */}
      <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/20">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200">Execution Matrix Heatmap</h3>
              <p className="text-[11px] text-slate-500">Chronological distribution of daily study and building logs (Last 12 Weeks).</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
            <span>Less</span>
            <span className="h-2.5 w-2.5 rounded bg-slate-900 border border-slate-950" />
            <span className="h-2.5 w-2.5 rounded bg-emerald-950/40" />
            <span className="h-2.5 w-2.5 rounded bg-emerald-800/60" />
            <span className="h-2.5 w-2.5 rounded bg-emerald-600" />
            <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        {/* The Grid Stack */}
        <div className="overflow-x-auto pb-1 select-none">
          <div className="flex gap-1.5 min-w-[700px] justify-between">
            {/* Split the 84 items into 12 week chunks of 7 days */}
            {Array.from({ length: 12 }).map((_, weekIdx) => {
              const weekData = heatmapData.slice(weekIdx * 7, (weekIdx + 1) * 7);
              return (
                <div key={weekIdx} className="flex flex-col gap-1.5 flex-1">
                  {weekData.map((day, dayIdx) => {
                    const levelColors = [
                      'bg-slate-900 border border-slate-950',
                      'bg-emerald-950/30 border border-emerald-900/10',
                      'bg-emerald-800/50 border border-emerald-700/20',
                      'bg-emerald-600/70',
                      'bg-emerald-400 shadow-sm shadow-emerald-400/50',
                    ];
                    return (
                      <div
                        key={dayIdx}
                        className={`h-6.5 rounded-md flex items-center justify-center text-[8px] font-mono transition-colors cursor-pointer ${levelColors[day.level]}`}
                        title={`${day.date} : Effort Level ${day.level}`}
                      >
                        <span className="opacity-0 hover:opacity-100 text-slate-950 font-black">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                  <span className="text-[8px] font-mono text-slate-500 text-center mt-1 uppercase">Wk{weekIdx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Productivity Insights Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} flex items-start gap-3`}>
          <div className="h-8.5 w-8.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Consistency Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-display font-extrabold text-white">{insights.consistencyIndex}%</span>
              <span className="text-[9px] text-slate-500 font-mono">COMPLIANCE</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Reflects frequency of non-zero active logs against calendar total.</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} flex items-start gap-3`}>
          <div className="h-8.5 w-8.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Skill Specialisation</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-display font-extrabold text-white uppercase tracking-tight">{insights.primaryFocus}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Assessed specialty calculated dynamically from core hours ratio.</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} flex items-start gap-3`}>
          <div className="h-8.5 w-8.5 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Streak Velocity Status</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-display font-extrabold text-rose-400 uppercase tracking-wider">{insights.velocityStatus}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Calculates commitment density and momentum velocity.</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Panels (Weekly & Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Bar Chart */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="pb-4 mb-4 border-b border-slate-800/20">
            <h3 className="font-display font-bold text-sm text-slate-200">7-Day Study Metric Breakdown</h3>
            <p className="text-[11px] text-slate-500">Compares daily coding hours, DSA questions and project logs.</p>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} opacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" name="Coding Hours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="dsa" name="DSA Solved" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="projects" name="Project Hours" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Balance Radar Chart */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="pb-4 mb-4 border-b border-slate-800/20">
            <h3 className="font-display font-bold text-sm text-slate-200">Dynamic Career Competency Balance</h3>
            <p className="text-[11px] text-slate-500">Live shape representation of core skill disciplines (Max 99%).</p>
          </div>

          <div className="h-72 w-full text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillRadarData}>
                <PolarGrid stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeDasharray="4 4" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
                <Radar
                  name="Career Competency"
                  dataKey="value"
                  stroke="#a855f7"
                  fill="#6366f1"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>

      {/* MOBILE PROGRESS VIEW (Visible ONLY on screens < 768px) */}
      <div className="block md:hidden space-y-6 w-full max-w-xl mx-auto pb-32">
        {/* Mobile Header Card */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-slate-100">Velocity Center</h1>
                <p className="text-[11px] text-slate-400">Daily execution, streak & performance analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> {streak}d
            </div>
          </div>
        </div>

        {/* Mobile Quick Stat Summary Bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} text-center space-y-1`}>
            <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Streak</span>
            <p className="text-base font-display font-black text-amber-400">{streak} Days</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} text-center space-y-1`}>
            <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">DSA Solved</span>
            <p className="text-base font-display font-black text-purple-400">{totalQuestions}</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} text-center space-y-1`}>
            <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Hours Logged</span>
            <p className="text-base font-display font-black text-indigo-400">{totalHours.toFixed(1)}h</p>
          </div>
        </div>

        {/* Mobile Daily Work Logger */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-slate-200">
                {isLoggedToday ? "Review Today's Activity" : 'Record Daily Work Effort'}
              </h3>
            </div>
            {isLoggedToday && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                ✓ Recorded
              </span>
            )}
          </div>

          {/* Sliders in spacious touch cards */}
          <div className="space-y-3">
            {/* Coding Hours */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Coding Hours
                </span>
                <span className="font-mono text-indigo-400 font-bold text-xs">{hours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 min-h-[36px]"
              />
            </div>

            {/* DSA Questions */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-purple-400" /> DSA Questions
                </span>
                <span className="font-mono text-purple-400 font-bold text-xs">{dsa} problems</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={dsa}
                onChange={(e) => setDsa(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 min-h-[36px]"
              />
            </div>

            {/* Web Development */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-400" /> Web Development
                </span>
                <span className="font-mono text-emerald-400 font-bold text-xs">{webDev} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={webDev}
                onChange={(e) => setWebDev(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 min-h-[36px]"
              />
            </div>

            {/* Python Programming */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-400" /> Python Programming
                </span>
                <span className="font-mono text-amber-400 font-bold text-xs">{python} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={python}
                onChange={(e) => setPython(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 min-h-[36px]"
              />
            </div>

            {/* Reading / Prep */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Reading / Prep Time
                </span>
                <span className="font-mono text-indigo-400 font-bold text-xs">{reading} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={reading}
                onChange={(e) => setReading(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 min-h-[36px]"
              />
            </div>

            {/* Core Projects */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-rose-400" /> Core Projects Time
                </span>
                <span className="font-mono text-rose-400 font-bold text-xs">{projects} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={projects}
                onChange={(e) => setProjects(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 min-h-[36px]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProgress}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all min-h-[44px]"
          >
            {isLoggedToday ? "Update Today's Entry" : 'Lock Daily Progress'}
          </button>
        </div>

        {/* Mobile Productivity Insights Stack */}
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-3.5`}>
            <div className="h-10 w-10 bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Consistency Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-display font-extrabold text-white">{insights.consistencyIndex}%</span>
                <span className="text-[9px] text-slate-500 font-mono">COMPLIANCE</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-3.5`}>
            <div className="h-10 w-10 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skill Specialisation</span>
              <p className="text-sm font-display font-extrabold text-white uppercase tracking-tight mt-0.5">{insights.primaryFocus}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'} flex items-center gap-3.5`}>
            <div className="h-10 w-10 bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Streak Velocity Status</span>
              <p className="text-sm font-display font-extrabold text-rose-400 uppercase tracking-wider mt-0.5">{insights.velocityStatus}</p>
            </div>
          </div>
        </div>

        {/* Mobile Interactive / Swipeable Chart Section */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
          {/* Section Header with Navigation Arrows */}
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200">Performance Analytics</h3>
                <p className="text-[10px] text-slate-400">Swipe or tap tabs to switch charts</p>
              </div>
            </div>

            {/* Chevron Swipe Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevChartTab}
                aria-label="Previous Chart"
                className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-95 cursor-pointer min-h-[32px]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextChartTab}
                aria-label="Next Chart"
                className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-95 cursor-pointer min-h-[32px]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setMobileChartTab('bar')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                mobileChartTab === 'bar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> 7-Day Bar
            </button>

            <button
              type="button"
              onClick={() => setMobileChartTab('radar')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                mobileChartTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" /> Skill Radar
            </button>

            <button
              type="button"
              onClick={() => setMobileChartTab('heatmap')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                mobileChartTab === 'heatmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> 12-Wk Matrix
            </button>

            <button
              type="button"
              onClick={() => setMobileChartTab('area')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                mobileChartTab === 'area'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="h-3.5 w-3.5" /> 14-Day Trend
            </button>
          </div>

          {/* Active Chart View Container */}
          <div className="pt-2">
            {mobileChartTab === 'bar' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>7-Day Study Metric Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hours / DSA / Projects</span>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} opacity={0.4} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="hours" name="Coding Hours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={10} />
                      <Bar dataKey="dsa" name="DSA Solved" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={10} />
                      <Bar dataKey="projects" name="Project Hours" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {mobileChartTab === 'radar' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Career Competency Balance</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Skill Distribution</span>
                </div>
                <div className="h-64 w-full text-xs flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={skillRadarData}>
                      <PolarGrid stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeDasharray="4 4" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
                      <Radar name="Career Competency" dataKey="value" stroke="#a855f7" fill="#6366f1" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {mobileChartTab === 'heatmap' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Execution Matrix Heatmap</span>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400">
                    <span>Less</span>
                    <span className="h-2 w-2 rounded bg-slate-900 border border-slate-950" />
                    <span className="h-2 w-2 rounded bg-emerald-600" />
                    <span className="h-2 w-2 rounded bg-emerald-400" />
                    <span>More</span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2 select-none">
                  <div className="flex gap-1.5 min-w-[550px] justify-between">
                    {Array.from({ length: 12 }).map((_, weekIdx) => {
                      const weekData = heatmapData.slice(weekIdx * 7, (weekIdx + 1) * 7);
                      return (
                        <div key={weekIdx} className="flex flex-col gap-1.5 flex-1">
                          {weekData.map((day, dayIdx) => {
                            const levelColors = [
                              'bg-slate-900 border border-slate-950',
                              'bg-emerald-950/30 border border-emerald-900/10',
                              'bg-emerald-800/50 border border-emerald-700/20',
                              'bg-emerald-600/70',
                              'bg-emerald-400 shadow-sm shadow-emerald-400/50',
                            ];
                            return (
                              <div
                                key={dayIdx}
                                className={`h-5 rounded flex items-center justify-center text-[7px] font-mono ${levelColors[day.level]}`}
                              />
                            );
                          })}
                          <span className="text-[7px] font-mono text-slate-500 text-center uppercase">Wk{weekIdx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {mobileChartTab === 'area' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>14-Day Velocity Trend</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Cumulative Progress</span>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} opacity={0.4} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="hours" name="Coding Hours" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="learning" name="Prep Index" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
