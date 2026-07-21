import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Briefcase,
  Calendar,
  Link,
  Sparkles,
  Compass,
  FileText,
  Loader2,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { Opportunity, CategoryType, PriorityType } from '../types';
import { simulateGeminiExtraction } from './OpportunitiesView';

interface QuickAddModalProps {
  theme: 'light' | 'dark';
  onAddOpportunity: (opp: Opportunity) => void;
}

export default function QuickAddModal({ theme, onAddOpportunity }: QuickAddModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState<CategoryType>('Internship');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityType>('High');
  const [applicationLink, setApplicationLink] = useState('');
  const [source, setSource] = useState('Smart Quick Add');

  // Smart Extracted Fields State
  const [skills, setSkills] = useState<string[]>([]);
  const [eligibility, setEligibility] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; label: string; done: boolean }[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [resumeVersion, setResumeVersion] = useState('Resume_V3_SWE.pdf');
  const [tags, setTags] = useState<string[]>([]);

  // Extraction Animation States
  const [smartUrl, setSmartUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState('');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);

  // Speed Dial states
  const [menuOpen, setMenuOpen] = useState(false);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setMenuOpen(false);
    setHudMessage(message);
    setTimeout(() => {
      setHudMessage(null);
    }, 4000);
  };

  // Primary 3 speed dial items as strictly requested: Add Opportunity, Quick Note, Journey Entry
  const primarySpeedDialItems = [
    {
      label: 'Add Opportunity',
      icon: Briefcase,
      color: 'from-indigo-600 to-purple-600',
      action: () => {
        setIsOpen(true);
        setMenuOpen(false);
      },
    },
    {
      label: 'Quick Note',
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      action: () => showNotification('Quick Note is available in your Notes workspace.'),
    },
    {
      label: 'Journey Entry',
      icon: Compass,
      color: 'from-amber-500 to-orange-600',
      action: () => showNotification('Journey Entry is available in your Career Journey.'),
    },
  ];

  const resetForm = () => {
    setTitle('');
    setOrganization('');
    setCategory('Internship');
    setDeadline('');
    setPriority('High');
    setApplicationLink('');
    setSource('Smart Quick Add');
    setSkills([]);
    setEligibility('');
    setChecklist([]);
    setDocuments([]);
    setResumeVersion('Resume_V3_SWE.pdf');
    setTags([]);
    setSmartUrl('');
    setAutoFillSuccess(false);
  };

  const handleSmartExtract = async () => {
    if (!smartUrl) return;

    setIsExtracting(true);
    setExtractionProgress(0);

    const steps = [
      { pct: 25, text: 'Fetching link metadata headers...' },
      { pct: 50, text: 'Parsing role requirements & eligibility...' },
      { pct: 75, text: 'Mapping skills, checklist & resume version...' },
      { pct: 100, text: 'Auto-filling 13 opportunity parameters!' },
    ];

    for (let i = 0; i < steps.length; i++) {
      setExtractionStep(steps[i].text);
      setExtractionProgress(steps[i].pct);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const payload = simulateGeminiExtraction(smartUrl);

    setTitle(payload.title);
    setOrganization(payload.organization);
    setCategory(payload.category);
    setDeadline(payload.deadline);
    setSource(payload.source);
    setPriority(payload.priority);
    setApplicationLink(payload.applicationLink);
    setSkills(payload.skills);
    setEligibility(payload.eligibility);
    setChecklist(payload.checklist);
    setDocuments(payload.documents);
    setResumeVersion(payload.resumeVersion);
    setTags(payload.tags);

    setIsExtracting(false);
    setAutoFillSuccess(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !organization) return;

    const defaultDeadline = deadline || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      title,
      organization,
      category,
      source: source || 'Smart Quick Add',
      applicationLink,
      applyDate: new Date().toISOString().split('T')[0],
      deadline: defaultDeadline,
      status: 'Saved',
      priority,
      notes: 'Captured via Smart Opportunity Quick Add.',
      skills,
      eligibility,
      checklist,
      documents,
      resumeVersion,
      tags,
    };

    onAddOpportunity(newOpp);
    resetForm();
    setIsOpen(false);
    showNotification('Opportunity added');
  };

  const categories: CategoryType[] = [
    'Internship',
    'Hackathon',
    'Competition',
    'Fellowship',
    'Scholarship',
    'Quiz',
    'Workshop',
    'Certification',
  ];

  // Keyboard Navigation: Close modal or speed dial on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false);
        } else if (menuOpen) {
          setMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, menuOpen]);

  return (
    <>
      {/* HUD Notification */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            role="status"
            aria-live="polite"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-slate-900/95 text-slate-100 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>{hudMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed Dial Stack */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setMenuOpen(false);
              }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 cursor-pointer"
            />

            <div
              className="fixed bottom-36 md:bottom-22 right-5 sm:right-6 md:right-8 z-40 flex flex-col items-end gap-2.5 max-w-[280px]"
              role="menu"
              aria-label="Quick capture speed dial"
            >
              {/* Focused quick actions */}
              {primarySpeedDialItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.88 }}
                    transition={{ delay: (primarySpeedDialItems.length - 1 - idx) * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                    className="flex items-center gap-3 active:scale-98 transition-transform"
                  >
                    <span className="bg-slate-900/95 text-slate-100 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md select-none">
                      {item.label}
                    </span>

                    <button
                      type="button"
                      onClick={item.action}
                      aria-label={`Action: ${item.label}`}
                      className={`h-12 w-12 rounded-full bg-gradient-to-tr ${item.color} text-white shadow-xl border border-white/20 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center cursor-pointer min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Add Trigger Button */}
      <motion.button
        type="button"
        id="floating-quick-add-btn"
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
        aria-label={menuOpen ? 'Close quick add menu' : 'Open quick add menu'}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        animate={{ rotate: menuOpen ? 135 : 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-6 right-5 sm:right-6 md:right-8 z-40 flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl glow-blue hover:from-indigo-500 hover:to-purple-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[48px] min-w-[48px]"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
      </motion.button>

      {/* Quick Add Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-add-title"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 border-slate-800 text-slate-100'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              } backdrop-blur-md z-10 max-h-[90vh] overflow-y-auto`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" aria-hidden="true" />
                  <h3 id="quick-add-title" className="font-display font-bold text-lg">Smart Opportunity Quick Capture</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close modal"
                  className={`p-1.5 rounded-lg hover:bg-slate-800/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* URL Smart Extraction Box */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="qa-smart-url" className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 cursor-pointer">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Smart URL Auto-Fill
                  </label>
                  <span className="text-[8px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                    13 Fields
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="qa-smart-url"
                    type="url"
                    placeholder="Paste opportunity link to auto-extract..."
                    value={smartUrl}
                    onChange={(e) => setSmartUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSmartExtract}
                    disabled={!smartUrl || isExtracting}
                    aria-label="Extract parameters from URL"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {isExtracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                    Extract
                  </button>
                </div>

                {/* Extraction Animation Progress */}
                {isExtracting && (
                  <div className="pt-2 space-y-1" role="status" aria-live="polite">
                    <div className="flex justify-between text-[10px] font-mono text-indigo-300">
                      <span>{extractionStep}</span>
                      <span>{extractionProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${extractionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {autoFillSuccess && (
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 pt-1" role="status" aria-live="polite">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> All 13 fields auto-extracted & filled successfully!
                  </p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Title */}
                <div className="space-y-1">
                  <label htmlFor="qa-role-title" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Role Title *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500">
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="qa-role-title"
                      type="text"
                      required
                      placeholder="e.g. Frontend Engineer Intern"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-1">
                  <label htmlFor="qa-org" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Organization / Company *
                  </label>
                  <input
                    id="qa-org"
                    type="text"
                    required
                    placeholder="e.g. Google"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="qa-category" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Category
                    </label>
                    <select
                      id="qa-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="qa-priority" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Priority Rank
                    </label>
                    <select
                      id="qa-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label htmlFor="qa-deadline" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Deadline *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="qa-deadline"
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Extracted Skills Preview */}
                {skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block">
                      Extracted Skills ({skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s) => (
                        <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Link */}
                <div className="space-y-1">
                  <label htmlFor="qa-app-url" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Application Portal URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">
                      <Link className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="qa-app-url"
                      type="url"
                      placeholder="https://..."
                      value={applicationLink}
                      onChange={(e) => setApplicationLink(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all glow-blue flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /> Save Opportunity Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
