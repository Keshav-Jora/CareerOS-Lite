import React, { useState, useMemo } from 'react';
import {
  Search,
  AlertCircle,
  Briefcase,
  Award,
  FileText,
  Clock,
  Filter,
  Layers,
  Calendar,
  Code,
  Trophy,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FolderGit2,
  X,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { Opportunity, Certificate, Note, TimelineEntry, DailyProgress } from '../types';
import { getTimelineEntries, getDailyProgress } from '../utils/storage';

export type MemoryCategoryFilter =
  | 'all'
  | 'applications'
  | 'certificates'
  | 'journey'
  | 'progress'
  | 'hackathons'
  | 'internships'
  | 'competitions'
  | 'projects';

export interface CareerMemoryResult {
  id: string;
  type: 'opportunity' | 'certificate' | 'journey' | 'progress' | 'note';
  categoryTag: string;
  title: string;
  subtitle: string;
  date: string;
  status?: string;
  priority?: string;
  meta?: string;
  details?: string;
  link?: string;
  badgeColor?: string;
}

export interface CareerMemoryProps {
  theme?: 'light' | 'dark';
  opportunities?: Opportunity[];
  certificates?: Certificate[];
  notes?: Note[];
  timelineEntries?: TimelineEntry[];
  progress?: DailyProgress[];
  initialQuery?: string;
  onSelectResult?: (result: CareerMemoryResult) => void;
  className?: string;
}

/**
 * Reusable Career History Search Engine
 * Deterministic multi-dimensional search across all local career history
 */
export function searchCareerHistory({
  query,
  activeFilter,
  opportunities = [],
  certificates = [],
  notes = [],
  timelineEntries = [],
  progress = [],
}: {
  query: string;
  activeFilter: MemoryCategoryFilter;
  opportunities?: Opportunity[];
  certificates?: Certificate[];
  notes?: Note[];
  timelineEntries?: TimelineEntry[];
  progress?: DailyProgress[];
}): CareerMemoryResult[] {
  const q = query.trim().toLowerCase();
  const results: CareerMemoryResult[] = [];

  // Month detection mapping
  const monthMap: Record<string, string[]> = {
    january: ['01', 'january', 'jan'],
    jan: ['01', 'january', 'jan'],
    february: ['02', 'february', 'feb'],
    feb: ['02', 'february', 'feb'],
    march: ['03', 'march', 'mar'],
    mar: ['03', 'march', 'mar'],
    april: ['04', 'april', 'apr'],
    apr: ['04', 'april', 'apr'],
    may: ['05', 'may'],
    june: ['06', 'june', 'jun'],
    jun: ['06', 'june', 'jun'],
    july: ['07', 'july', 'jul'],
    jul: ['07', 'july', 'jul'],
    august: ['08', 'august', 'aug'],
    aug: ['08', 'august', 'aug'],
    september: ['09', 'september', 'sep'],
    sep: ['09', 'september', 'sep'],
    october: ['10', 'october', 'oct'],
    oct: ['10', 'october', 'oct'],
    november: ['11', 'november', 'nov'],
    nov: ['11', 'november', 'nov'],
    december: ['12', 'december', 'dec'],
    dec: ['12', 'december', 'dec'],
  };

  let detectedMonthNum: string | null = null;
  let detectedMonthName: string | null = null;

  for (const [key, patterns] of Object.entries(monthMap)) {
    if (q.includes(key)) {
      detectedMonthNum = patterns[0];
      detectedMonthName = key;
      break;
    }
  }

  // Detect status keywords in query
  const isRejectedQuery = q.includes('reject') || q.includes('rejected');
  const isInterviewQuery = q.includes('interview') || q.includes('interviewing');
  const isAppliedQuery = q.includes('applied') || q.includes('under review');
  const isSelectedQuery = q.includes('selected') || q.includes('offer') || q.includes('accepted');

  // Helper date checker
  const dateMatchesMonth = (dateStr?: string) => {
    if (!dateStr || !detectedMonthNum) return true;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return parts[1] === detectedMonthNum;
    }
    return dateStr.toLowerCase().includes(detectedMonthName || '');
  };

  // Noise words to omit from token matching
  const metaWords = [
    'show', 'me', 'all', 'the', 'my', 'list', 'applications', 'application',
    'opportunities', 'opportunity', 'internships', 'internship', 'hackathons',
    'hackathon', 'competitions', 'competition', 'certificates', 'certificate',
    'journey', 'progress', 'projects', 'project', 'rejected', 'interview',
    'applied', 'selected', 'june', 'july', 'august', 'september', 'october',
    'november', 'december', 'january', 'february', 'march', 'april', 'may'
  ];

  const queryTokens = q
    .split(/\s+/)
    .filter((t) => t.length > 1 && !metaWords.includes(t));

  const textMatchesTokens = (textToSearch: string) => {
    if (queryTokens.length === 0) return true;
    const lower = textToSearch.toLowerCase();
    return queryTokens.every((token) => lower.includes(token));
  };

  const shouldIncludeOpps =
    activeFilter === 'all' ||
    activeFilter === 'applications' ||
    activeFilter === 'hackathons' ||
    activeFilter === 'internships' ||
    activeFilter === 'competitions' ||
    activeFilter === 'projects';

  const shouldIncludeCerts = activeFilter === 'all' || activeFilter === 'certificates';
  const shouldIncludeJourney = activeFilter === 'all' || activeFilter === 'journey' || activeFilter === 'projects';
  const shouldIncludeProgress = activeFilter === 'all' || activeFilter === 'progress';
  const shouldIncludeNotes = activeFilter === 'all' || activeFilter === 'projects';

  // 1. OPPORTUNITIES
  if (shouldIncludeOpps) {
    opportunities.forEach((o) => {
      const cat = o.category.toLowerCase();
      const status = o.status.toLowerCase();

      // Filter category constraint
      if (activeFilter === 'hackathons' && !cat.includes('hackathon') && !o.title.toLowerCase().includes('hackathon')) return;
      if (activeFilter === 'internships' && !cat.includes('internship') && !o.title.toLowerCase().includes('internship')) return;
      if (activeFilter === 'competitions' && !cat.includes('competition') && !o.title.toLowerCase().includes('competition')) return;
      if (activeFilter === 'projects' && !cat.includes('fellowship') && !cat.includes('project')) return;

      // Text query constraints for hackathon/internship/etc
      if (q.includes('hackathon') && !cat.includes('hackathon') && !o.title.toLowerCase().includes('hackathon')) return;
      if (q.includes('internship') && !cat.includes('internship') && !o.title.toLowerCase().includes('internship')) return;
      if (q.includes('competition') && !cat.includes('competition') && !o.title.toLowerCase().includes('competition')) return;

      // Status constraints
      if (isRejectedQuery && status !== 'rejected') return;
      if (isInterviewQuery && status !== 'interview') return;
      if (isAppliedQuery && status !== 'applied' && status !== 'under review') return;
      if (isSelectedQuery && status !== 'selected') return;

      // Month constraints
      if (detectedMonthNum && !dateMatchesMonth(o.applyDate) && !dateMatchesMonth(o.deadline)) return;

      // Token match
      const searchableContent = `${o.title} ${o.organization} ${o.notes} ${o.source} ${o.category} ${o.status}`;
      if (!textMatchesTokens(searchableContent)) return;

      results.push({
        id: o.id,
        type: 'opportunity',
        categoryTag: o.category,
        title: o.title,
        subtitle: o.organization,
        date: o.applyDate || o.deadline,
        status: o.status,
        priority: o.priority,
        meta: `Category: ${o.category} • Source: ${o.source}`,
        details: o.notes,
        link: o.applicationLink,
        badgeColor:
          o.status === 'Rejected'
            ? 'rose'
            : o.status === 'Interview'
            ? 'indigo'
            : o.status === 'Selected'
            ? 'emerald'
            : 'amber',
      });
    });
  }

  // 2. CERTIFICATES
  if (shouldIncludeCerts && !isRejectedQuery && !isInterviewQuery) {
    certificates.forEach((c) => {
      if (detectedMonthNum && !dateMatchesMonth(c.date)) return;

      const searchableContent = `${c.name} ${c.platform} ${c.category} ${c.notes}`;
      if (!textMatchesTokens(searchableContent)) return;

      results.push({
        id: c.id,
        type: 'certificate',
        categoryTag: 'Certificate',
        title: c.name,
        subtitle: c.platform,
        date: c.date,
        meta: `Verified Credential • Category: ${c.category}`,
        details: c.notes,
        badgeColor: 'amber',
      });
    });
  }

  // 3. JOURNEY (TIMELINE)
  if (shouldIncludeJourney && !isRejectedQuery && !isInterviewQuery) {
    timelineEntries.forEach((t) => {
      if (detectedMonthNum && !dateMatchesMonth(t.date)) return;
      if (q.includes('hackathon') && !t.built.toLowerCase().includes('hackathon') && !t.achievements.toLowerCase().includes('hackathon')) return;

      const searchableContent = `${t.learned} ${t.built} ${t.codingPractice} ${t.achievements} ${t.applications.join(' ')} ${t.certificates.join(' ')}`;
      if (!textMatchesTokens(searchableContent)) return;

      results.push({
        id: t.id,
        type: 'journey',
        categoryTag: 'Journey Milestone',
        title: t.achievements || `Milestone Log (${t.date})`,
        subtitle: t.built ? `Built: ${t.built}` : `Learned: ${t.learned}`,
        date: t.date,
        meta: `Practice: ${t.codingPractice || 'N/A'}`,
        details: `Learned: ${t.learned}\nBuilt: ${t.built}`,
        badgeColor: 'purple',
      });
    });
  }

  // 4. DAILY PROGRESS
  if (shouldIncludeProgress && !isRejectedQuery && !isInterviewQuery) {
    progress.forEach((p) => {
      if (detectedMonthNum && !dateMatchesMonth(p.date)) return;

      if (q.includes('python') && p.pythonHours === 0) return;

      const searchableContent = `progress ${p.date} dsa ${p.dsaQuestions} coding ${p.codingHours} webdev ${p.webDevHours} python ${p.pythonHours}`;
      if (!textMatchesTokens(searchableContent)) return;

      if (p.dsaQuestions > 0 || p.codingHours > 0 || p.applicationsCount > 0) {
        results.push({
          id: `prog-${p.date}`,
          type: 'progress',
          categoryTag: 'Daily Progress',
          title: `Progress Log: ${p.date}`,
          subtitle: `${p.dsaQuestions} DSA Solved • ${p.codingHours}h Coding Practice`,
          date: p.date,
          meta: `Python: ${p.pythonHours}h | Web Dev: ${p.webDevHours}h | Projects: ${p.projectsHours}h`,
          details: `${p.applicationsCount} application(s) submitted on this date.`,
          badgeColor: 'emerald',
        });
      }
    });
  }

  // 5. NOTES & PROJECTS
  if (shouldIncludeNotes && !isRejectedQuery && !isInterviewQuery) {
    notes.forEach((n) => {
      const searchableContent = `${n.title} ${n.content} ${n.tags.join(' ')}`;
      if (!textMatchesTokens(searchableContent)) return;

      results.push({
        id: n.id,
        type: 'note',
        categoryTag: 'Knowledge Note',
        title: n.title,
        subtitle: n.tags.map((t) => `#${t}`).join(', ') || 'Document Note',
        date: n.updatedAt.split('T')[0],
        meta: `Tags: ${n.tags.join(', ')}`,
        details: n.content.slice(0, 150) + '...',
        badgeColor: 'indigo',
      });
    });
  }

  return results;
}

export default function CareerMemory({
  theme = 'dark',
  opportunities = [],
  certificates = [],
  notes = [],
  timelineEntries = [],
  progress = [],
  initialQuery = '',
  onSelectResult,
  className = '',
}: CareerMemoryProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<MemoryCategoryFilter>('all');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Fallback to local storage getters if props are not passed
  const effectiveTimeline = useMemo(() => {
    return timelineEntries.length > 0 ? timelineEntries : getTimelineEntries();
  }, [timelineEntries]);

  const effectiveProgress = useMemo(() => {
    return progress.length > 0 ? progress : getDailyProgress();
  }, [progress]);

  const sampleSuggestions = [
    { label: 'Show Google applications.', query: 'Show Google applications' },
    { label: 'Show rejected internships.', query: 'Show rejected internships' },
    { label: 'Show June hackathons.', query: 'Show June hackathons' },
    { label: 'Show Python opportunities.', query: 'Show Python opportunities' },
    { label: 'Show certificates.', query: 'Show certificates' },
    { label: 'Show journey milestones.', query: 'Show journey milestones' },
  ];

  const filterTabs: { id: MemoryCategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All History', icon: <Layers className="h-3 w-3" /> },
    { id: 'applications', label: 'Applications', icon: <Briefcase className="h-3 w-3" /> },
    { id: 'certificates', label: 'Certificates', icon: <Award className="h-3 w-3" /> },
    { id: 'journey', label: 'Journey', icon: <GraduationCap className="h-3 w-3" /> },
    { id: 'progress', label: 'Progress', icon: <Code className="h-3 w-3" /> },
    { id: 'hackathons', label: 'Hackathons', icon: <Trophy className="h-3 w-3" /> },
    { id: 'internships', label: 'Internships', icon: <Briefcase className="h-3 w-3" /> },
    { id: 'competitions', label: 'Competitions', icon: <Trophy className="h-3 w-3" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="h-3 w-3" /> },
  ];

  const handleSuggestionClick = (queryText: string) => {
    setSearchQuery(queryText);
  };

  // Perform deterministic search execution
  const results = useMemo(() => {
    return searchCareerHistory({
      query: searchQuery,
      activeFilter,
      opportunities,
      certificates,
      notes,
      timelineEntries: effectiveTimeline,
      progress: effectiveProgress,
    });
  }, [searchQuery, activeFilter, opportunities, certificates, notes, effectiveTimeline, effectiveProgress]);

  return (
    <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-200">Career Memory Vault</h3>
            <p className="text-[11px] text-slate-500">Searchable indexed history across applications, certificates, journey & progress.</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
          LOCAL SEARCH INDEX
        </span>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search history (e.g. 'Show Google applications', 'Show June hackathons')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
            theme === 'dark'
              ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50'
              : 'bg-white border-slate-200 text-slate-850 placeholder:text-slate-400'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
            title="Clear Search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Example Suggestion Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quick Searches:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sampleSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s.query)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                searchQuery === s.query
                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 font-bold'
                  : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Area */}
      <div className="pt-2 border-t border-slate-800/20 space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-mono">
          <span>{searchQuery ? `Search Results for "${searchQuery}"` : 'All History Items'}</span>
          <span>{results.length} matches</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {results.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-850 text-center bg-slate-900/10">
              <AlertCircle className="h-4 w-4 text-slate-500 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400 font-semibold">No direct history records match your search query.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Try selecting a category tab or click one of the quick search examples above.</p>
            </div>
          ) : (
            results.map((r) => {
              const isExpanded = expandedResultId === r.id;
              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isExpanded
                      ? 'bg-slate-900/80 border-indigo-500/50'
                      : 'bg-slate-950/30 border-slate-800/60 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      onClick={() => {
                        setExpandedResultId(isExpanded ? null : r.id);
                        if (onSelectResult) onSelectResult(r);
                      }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {r.type === 'opportunity' ? (
                          <Briefcase className="h-4 w-4 text-indigo-400" />
                        ) : r.type === 'certificate' ? (
                          <Award className="h-4 w-4 text-amber-400" />
                        ) : r.type === 'journey' ? (
                          <GraduationCap className="h-4 w-4 text-purple-400" />
                        ) : r.type === 'progress' ? (
                          <Code className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{r.title}</h4>
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                            {r.categoryTag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        {r.status && (
                          <span
                            className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border block mb-0.5 ${
                              r.status === 'Rejected'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : r.status === 'Interview'
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : r.status === 'Selected'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-500 block">{r.date}</span>
                      </div>

                      <button
                        onClick={() => setExpandedResultId(isExpanded ? null : r.id)}
                        className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                      >
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Panel */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 text-[11px] space-y-1.5 text-slate-300">
                      {r.meta && <p className="font-medium text-indigo-300/90">{r.meta}</p>}
                      {r.details && (
                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{r.details}</p>
                      )}
                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1"
                        >
                          <span>Open Application Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

