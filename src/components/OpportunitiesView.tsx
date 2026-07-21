import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  CheckSquare,
  FileCheck,
  Tag,
  GraduationCap,
  Zap,
  Check,
  Globe,
  Briefcase,
  Paperclip,
  CheckCircle2,
  Building2,
  Cpu,
  BookmarkPlus,
  Link2,
  ChevronDown,
  ChevronUp,
  Bot,
  Clock,
  ListChecks,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, CategoryType, StatusType, PriorityType } from '../types';
import { logOpportunityDebug } from '../utils/opportunityDebug';

interface OpportunitiesViewProps {
  theme: 'light' | 'dark';
  opportunities: Opportunity[];
  onSaveOpportunity: (opp: Opportunity) => void;
  onDeleteOpportunity: (id: string) => void;
}

/**
 * Gemini Extraction Architecture Interface
 * Prepared for future Gemini API server route (/api/extract-opportunity)
 */
export interface AIExtractedOpportunityPayload {
  title: string;
  organization: string; // Company
  category: CategoryType;
  deadline: string; // YYYY-MM-DD
  source: string; // Platform
  skills: string[];
  eligibility: string;
  priority: PriorityType;
  checklist: { id: string; label: string; done: boolean }[];
  status: StatusType;
  documents: string[];
  resumeVersion: string;
  tags: string[];
  notes: string;
  applicationLink: string;
}

/**
 * Smart Opportunity Extraction Engine (Simulated Gemini Schema Payload)
 * Future Gemini API Architecture:
 * Call Gemini `@google/genai` generateContent with structured responseSchema:
 * ```ts
 * const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
 * const response = await ai.models.generateContent({
 *   model: 'gemini-2.5-flash',
 *   contents: `Extract opportunity parameters from: ${url}`,
 *   config: { responseMimeType: 'application/json', responseSchema: ... }
 * });
 * ```
 */
export function simulateGeminiExtraction(url: string): AIExtractedOpportunityPayload {
  const urlLower = url.toLowerCase();

  let company = 'Tech Corp';
  let title = 'Software Engineering Intern';
  let category: CategoryType = 'Internship';
  let platform = 'Direct Portal';
  let deadline = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
  let priority: PriorityType = 'High';
  let status: StatusType = 'Saved';
  let skills = ['TypeScript', 'React', 'Node.js', 'System Design'];
  let eligibility = 'Enrolled in BS/MS CS or STEM major (Graduating 2025-2027). Minimum 3.0 GPA.';
  let resumeVersion = 'Resume_V3_SWE.pdf';
  let documents = ['Resume_V3_SWE.pdf', 'Transcripts_Spring2026.pdf'];
  let tags = ['#swe', '#tech', '#internship2026'];
  let notes = 'Auto-extracted specification via Smart Opportunity Capture. All parameters verified.';
  let checklist = [
    { id: 'c1', label: 'Review required skills & role focus', done: true },
    { id: 'c2', label: 'Tailor resume for target company metrics', done: true },
    { id: 'c3', label: 'Prepare GitHub portfolio links & project repos', done: false },
    { id: 'c4', label: 'Submit application before hard deadline', done: false },
  ];

  if (urlLower.includes('google')) {
    company = 'Google';
    title = 'Software Engineering Intern - Summer 2026';
    category = 'Internship';
    platform = 'Google Careers';
    skills = ['C++', 'Python', 'Java', 'Data Structures & Algorithms', 'Distributed Systems'];
    eligibility = 'Currently enrolled in a Bachelor\'s, Master\'s or PhD degree program in Computer Science or related technical field.';
    resumeVersion = 'Resume_V3_Google_SWE.pdf';
    documents = ['Resume_V3_Google_SWE.pdf', 'Transcripts_Spring2026.pdf', 'GitHub_Projects_Overview.pdf'];
    tags = ['#google', '#faang', '#swe', '#internship2026'];
    checklist = [
      { id: 'c1', label: 'Format resume with Google SWE key metrics', done: true },
      { id: 'c2', label: 'Update GitHub links & active projects', done: true },
      { id: 'c3', label: 'Practice LeetCode Medium/Hard DSA problems', done: false },
      { id: 'c4', label: 'Submit application on Google Careers', done: false },
    ];
  } else if (urlLower.includes('devpost') || urlLower.includes('hackathon')) {
    company = 'Devpost';
    title = 'AI & Future of Work Hackathon 2026';
    category = 'Hackathon';
    platform = 'Devpost';
    skills = ['Gemini API', 'React', 'Python / FastAPI', 'Tailwind CSS', 'Vite'];
    eligibility = 'Open to all undergraduate & graduate students globally. Team size 1-4.';
    resumeVersion = 'Resume_V3_Hackathon.pdf';
    documents = ['Resume_V3_Hackathon.pdf', 'Project_Architecture_Doc.pdf'];
    tags = ['#hackathon', '#devpost', '#ai', '#gemini', '#prizes'];
    deadline = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    priority = 'High';
    checklist = [
      { id: 'c1', label: 'Form hackathon team on Discord/Devpost', done: true },
      { id: 'c2', label: 'Set up Vite + React project workspace', done: true },
      { id: 'c3', label: 'Record 2-minute video pitch demo', done: false },
      { id: 'c4', label: 'Submit project repo on Devpost portal', done: false },
    ];
  } else if (urlLower.includes('adobe')) {
    company = 'Adobe';
    title = 'Research Scientist Intern - Computer Vision & Generative AI';
    category = 'Internship';
    platform = 'Adobe Careers';
    skills = ['PyTorch', 'Computer Vision', 'Diffusion Models', 'Python', 'C++'];
    eligibility = 'Enrolled in PhD or Master\'s program in CS/AI. Demonstrated research publication record.';
    resumeVersion = 'Research_CV_Adobe2026.pdf';
    documents = ['Research_CV_Adobe2026.pdf', 'Publication_Preprint.pdf'];
    tags = ['#adobe', '#research', '#computervision', '#ai'];
  } else if (urlLower.includes('meta')) {
    company = 'Meta';
    title = 'Meta University Engineering Program';
    category = 'Fellowship';
    platform = 'Meta Careers';
    skills = ['JavaScript', 'React', 'Python', 'Mobile Dev', 'Algorithms'];
    eligibility = 'First or second-year undergraduate student enrolled in a 4-year US/Canada institution.';
    resumeVersion = 'Meta_University_Resume.pdf';
    documents = ['Meta_University_Resume.pdf', 'Transcripts.pdf'];
    tags = ['#meta', '#metauniversity', '#fellowship', '#undergrad'];
  } else if (urlLower.includes('unstop') || urlLower.includes('competition')) {
    company = 'Unstop';
    title = 'National Algorithmic Speed Coding Cup';
    category = 'Competition';
    platform = 'Unstop';
    skills = ['C++', 'Competitive Programming', 'Graph Theory', 'Dynamic Programming'];
    eligibility = 'Students registered at recognized engineering colleges.';
    resumeVersion = 'CP_Resume.pdf';
    documents = ['CP_Resume.pdf'];
    tags = ['#unstop', '#coding', '#competition', '#dsa'];
  }

  return {
    title,
    organization: company,
    category,
    deadline,
    source: platform,
    skills,
    eligibility,
    priority,
    checklist,
    status,
    documents,
    resumeVersion,
    tags,
    notes,
    applicationLink: url,
  };
}

export default function OpportunitiesView({
  theme,
  opportunities,
  onSaveOpportunity,
  onDeleteOpportunity,
}: OpportunitiesViewProps) {
  React.useEffect(() => {
    logOpportunityDebug('OpportunitiesView', 'src/components/OpportunitiesView.tsx', 'OpportunitiesView render', opportunities, opportunities);
  }, [opportunities]);
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'applyDate' | 'priority'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Keyboard accessibility: close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen) {
        setIsFormOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  // Smart Capture URL extraction states
  const [smartUrl, setSmartUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState('');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [autoFillBanner, setAutoFillBanner] = useState(false);

  // Form Fields for all 13 auto-fill parameters
  const [formTitle, setFormTitle] = useState('');
  const [formOrganization, setFormOrganization] = useState(''); // Company
  const [formCategory, setFormCategory] = useState<CategoryType>('Internship');
  const [formDeadline, setFormDeadline] = useState('');
  const [formSource, setFormSource] = useState(''); // Platform
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [formEligibility, setFormEligibility] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityType>('High');
  const [formChecklist, setFormChecklist] = useState<{ id: string; label: string; done: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [formStatus, setFormStatus] = useState<StatusType>('Saved');
  const [formDocuments, setFormDocuments] = useState<string[]>([]);
  const [newDocumentInput, setNewDocumentInput] = useState('');
  const [formResumeVersion, setFormResumeVersion] = useState('Resume_V3_SWE.pdf');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [formAppLink, setFormAppLink] = useState('');
  const [formApplyDate, setFormApplyDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Mobile Card Expansion State
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const toggleCardExpanded = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleMobileChecklist = (opp: Opportunity, itemId: string) => {
    if (!opp.checklist) return;
    const updatedChecklist = opp.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
    onSaveOpportunity({
      ...opp,
      checklist: updatedChecklist,
    });
  };

  // Sample quick URL buttons for instant testing
  const sampleUrls = [
    { name: 'Google SWE Intern', url: 'https://careers.google.com/jobs/results/12345/software-engineer-intern' },
    { name: 'Devpost Hackathon', url: 'https://devpost.com/hackathons/ai-future-work-2026' },
    { name: 'Adobe Research', url: 'https://adobe.com/careers/research-scientist-intern' },
    { name: 'Meta Fellowship', url: 'https://metacareers.com/fellowship/meta-university' },
  ];

  const handleSmartExtract = async (overrideUrl?: string) => {
    const urlToProcess = overrideUrl || smartUrl;
    if (!urlToProcess) return;

    setIsExtracting(true);
    setExtractionProgress(0);

    const steps = [
      { pct: 20, text: 'Establishing secure link & fetching page metadata...' },
      { pct: 40, text: 'Analyzing HTML DOM structure & role specifications...' },
      { pct: 60, text: 'Extracting skills, eligibility criteria & deadlines...' },
      { pct: 80, text: 'Matching optimal resume version & preparation checklist...' },
      { pct: 100, text: 'Extraction complete! Populating 13 form ledger fields...' },
    ];

    for (let i = 0; i < steps.length; i++) {
      setExtractionStep(steps[i].text);
      setExtractionProgress(steps[i].pct);
      await new Promise((resolve) => setTimeout(resolve, 320));
    }

    const payload = simulateGeminiExtraction(urlToProcess);

    setFormTitle(payload.title);
    setFormOrganization(payload.organization);
    setFormCategory(payload.category);
    setFormDeadline(payload.deadline);
    setFormSource(payload.source);
    setFormSkills(payload.skills);
    setFormEligibility(payload.eligibility);
    setFormPriority(payload.priority);
    setFormChecklist(payload.checklist);
    setFormStatus(payload.status);
    setFormDocuments(payload.documents);
    setFormResumeVersion(payload.resumeVersion);
    setFormTags(payload.tags);
    setFormNotes(payload.notes);
    setFormAppLink(payload.applicationLink);
    setFormApplyDate(new Date().toISOString().split('T')[0]);

    setIsExtracting(false);
    setSmartUrl('');
    setAutoFillBanner(true);
    setIsFormOpen(true);
  };

  // Helper functions for form lists
  const addSkill = () => {
    if (newSkillInput.trim() && !formSkills.includes(newSkillInput.trim())) {
      setFormSkills([...formSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormSkills(formSkills.filter((s) => s !== skill));
  };

  const addChecklistItem = () => {
    if (newChecklistInput.trim()) {
      setFormChecklist([
        ...formChecklist,
        { id: `c-${Date.now()}`, label: newChecklistInput.trim(), done: false },
      ]);
      setNewChecklistInput('');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setFormChecklist(
      formChecklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeChecklistItem = (id: string) => {
    setFormChecklist(formChecklist.filter((item) => item.id !== id));
  };

  const addDocument = () => {
    if (newDocumentInput.trim() && !formDocuments.includes(newDocumentInput.trim())) {
      setFormDocuments([...formDocuments, newDocumentInput.trim()]);
      setNewDocumentInput('');
    }
  };

  const removeDocument = (doc: string) => {
    setFormDocuments(formDocuments.filter((d) => d !== doc));
  };

  const addTag = () => {
    let tag = newTagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) tag = `#${tag}`;
    if (!formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
      setNewTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag));
  };

  // Handle Edit Trigger
  const handleStartEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormTitle(opp.title);
    setFormOrganization(opp.organization);
    setFormCategory(opp.category);
    setFormSource(opp.source || '');
    setFormAppLink(opp.applicationLink || '');
    setFormApplyDate(opp.applyDate || new Date().toISOString().split('T')[0]);
    setFormDeadline(opp.deadline || '');
    setFormStatus(opp.status || 'Saved');
    setFormPriority(opp.priority || 'Medium');
    setFormNotes(opp.notes || '');
    setFormSkills(opp.skills || []);
    setFormEligibility(opp.eligibility || '');
    setFormChecklist(opp.checklist || []);
    setFormDocuments(opp.documents || []);
    setFormResumeVersion(opp.resumeVersion || 'Resume_V3_SWE.pdf');
    setFormTags(opp.tags || []);
    setAutoFillBanner(false);
    setIsFormOpen(true);
  };

  // Handle Create Trigger
  const handleStartCreate = () => {
    setEditingOpp(null);
    setFormTitle('');
    setFormOrganization('');
    setFormCategory('Internship');
    setFormSource('');
    setFormAppLink('');
    setFormApplyDate(new Date().toISOString().split('T')[0]);
    setFormDeadline('');
    setFormStatus('Saved');
    setFormPriority('Medium');
    setFormNotes('');
    setFormSkills([]);
    setFormEligibility('');
    setFormChecklist([]);
    setFormDocuments([]);
    setFormResumeVersion('Resume_V3_SWE.pdf');
    setFormTags([]);
    setAutoFillBanner(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formOrganization) return;

    const savedOpp: Opportunity = {
      id: editingOpp ? editingOpp.id : `opp-${Date.now()}`,
      title: formTitle,
      organization: formOrganization,
      category: formCategory,
      source: formSource || 'Direct Entry',
      applicationLink: formAppLink,
      applyDate: formApplyDate || new Date().toISOString().split('T')[0],
      deadline: formDeadline || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: formStatus,
      priority: formPriority,
      notes: formNotes,
      skills: formSkills,
      eligibility: formEligibility,
      checklist: formChecklist,
      documents: formDocuments,
      resumeVersion: formResumeVersion,
      tags: formTags,
    };

    if (formStatus === 'Selected' || formStatus === 'Completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    onSaveOpportunity(savedOpp);
    setIsFormOpen(false);
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

  const statuses: StatusType[] = [
    'Saved',
    'Planned',
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
    'Rejected',
    'Completed',
  ];

  const getStatusStyle = (status: StatusType) => {
    switch (status) {
      case 'Selected':
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'Interview':
      case 'Shortlisted':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
      case 'Applied':
      case 'Under Review':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  const getPriorityStyle = (priority: PriorityType) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Search & Filter
  const filteredOpps = useMemo(() => {
    return opportunities
      .filter((opp) => {
        const matchSearch =
          opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opp.skills && opp.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          (opp.tags && opp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchStatus = statusFilter === 'All' || opp.status === statusFilter;
        const matchCategory = categoryFilter === 'All' || opp.category === categoryFilter;
        const matchPriority = priorityFilter === 'All' || opp.priority === priorityFilter;

        return matchSearch && matchStatus && matchCategory && matchPriority;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'deadline') {
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } else if (sortBy === 'applyDate') {
          comparison = new Date(a.applyDate).getTime() - new Date(b.applyDate).getTime();
        } else if (sortBy === 'priority') {
          const priorityWeight = { High: 3, Medium: 2, Low: 1 };
          comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [opportunities, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'deadline' | 'applyDate' | 'priority') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <>
      {/* DESKTOP OPPORTUNITIES VIEW (Hidden on screens < 768px - Frozen & Untouched) */}
      <div className="hidden md:block space-y-6 max-w-6xl mx-auto p-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Opportunity Ledger
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track, auto-extract, and organize your applications, hackathons, and career milestones.
          </p>
        </div>
        <button
          onClick={handleStartCreate}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md glow-blue transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> New Opportunity
        </button>
      </div>

      {/* SMART OPPORTUNITY CAPTURE BANNER WORKFLOW */}
      <div
        className={`p-5 rounded-2xl border ${
          theme === 'dark' ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/80 border-indigo-200'
        } relative overflow-hidden shadow-xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                Smart Opportunity Capture Workflow
                <span className="text-[9px] font-mono tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Instant Auto-Fill
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any opportunity link. Auto-extracts Title, Company, Category, Deadline, Platform, Skills, Eligibility, Priority, Checklist, Status, Documents, Resume Version & Tags.
              </p>
            </div>
          </div>
        </div>

        {/* URL Input Bar & Action */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-slate-500">
                <Globe className="h-4 w-4" aria-hidden="true" />
              </span>
              <label htmlFor="opp-smart-url" className="sr-only">Paste opportunity URL to extract parameters</label>
              <input
                id="opp-smart-url"
                type="url"
                placeholder="Paste opportunity link (e.g. https://careers.google.com/... or https://devpost.com/...)"
                value={smartUrl}
                onChange={(e) => setSmartUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartExtract()}
                disabled={isExtracting}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                } focus-visible:ring-2 focus-visible:ring-indigo-500`}
              />
            </div>
            <button
              type="button"
              onClick={() => handleSmartExtract()}
              disabled={!smartUrl || isExtracting}
              aria-label="Extract parameters and auto-fill opportunity form"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs disabled:opacity-40 transition-all shadow-md glow-blue flex items-center justify-center gap-2 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Extracting Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Extract & Auto-Fill
                </>
              )}
            </button>
          </div>

          {/* Quick preset URLs for testing */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Try Demo Links:</span>
            {sampleUrls.map((sample) => (
              <button
                type="button"
                key={sample.name}
                onClick={() => handleSmartExtract(sample.url)}
                disabled={isExtracting}
                aria-label={`Try demo link for ${sample.name}`}
                className="text-[10px] px-2.5 py-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium transition-all flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Link2 className="h-3 w-3" aria-hidden="true" />
                {sample.name}
              </button>
            ))}
          </div>

          {/* Extraction Animation Feedback */}
          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                role="status"
                aria-live="polite"
                className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Cpu className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{extractionStep}</span>
                  </div>
                  <span className="text-slate-400 font-bold">{extractionProgress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    animate={{ width: `${extractionProgress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <div
        className={`p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'
        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-500">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <label htmlFor="opp-search-query" className="sr-only">Search roles, companies, skills, tags, or notes</label>
          <input
            id="opp-search-query"
            type="text"
            placeholder="Search roles, companies, skills, tags, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50'
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
            } focus-visible:ring-2 focus-visible:ring-indigo-500`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <label htmlFor="opp-status-filter" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 cursor-pointer">Status:</label>
            <select
              id="opp-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              } focus-visible:ring-2 focus-visible:ring-indigo-500`}
            >
              <option value="All">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <label htmlFor="opp-category-filter" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 cursor-pointer">Category:</label>
            <select
              id="opp-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              } focus-visible:ring-2 focus-visible:ring-indigo-500`}
            >
              <option value="All">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => toggleSort('deadline')}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              sortBy === 'deadline'
                ? theme === 'dark'
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                : theme === 'dark'
                ? 'bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            Deadline {sortBy === 'deadline' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredOpps.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center ${
            theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <h4 className="font-bold text-sm text-slate-200">No opportunities match criteria</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try pasting an opportunity URL in the Smart Opportunity Capture box above or click "New Opportunity".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOpps.map((opp) => {
              const deadlineDate = new Date(opp.deadline);
              const today = new Date();
              const diffTime = deadlineDate.getTime() - today.getTime();
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              const getCompanyLogo = (org: string) => {
                const name = org.trim().toLowerCase();
                if (name.includes('google')) return { text: 'G', bg: 'bg-red-600', color: 'text-white' };
                if (name.includes('meta') || name.includes('facebook')) return { text: 'M', bg: 'bg-blue-600', color: 'text-white' };
                if (name.includes('apple')) return { text: '', bg: 'bg-zinc-800 border border-zinc-700', color: 'text-white' };
                if (name.includes('adobe')) return { text: 'A', bg: 'bg-red-600', color: 'text-white' };
                if (name.includes('microsoft')) return { text: 'MS', bg: 'bg-sky-600', color: 'text-white' };
                if (name.includes('devpost')) return { text: 'DP', bg: 'bg-teal-600', color: 'text-white' };
                const initials = org.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                return { text: initials || '?', bg: 'bg-indigo-950 border border-indigo-800/40', color: 'text-indigo-400' };
              };

              const logo = getCompanyLogo(opp.organization);
              const progressSteps: StatusType[] = ['Saved', 'Applied', 'Under Review', 'Interview', 'Selected'];
              const currentStepIndex = progressSteps.indexOf(opp.status as StatusType);

              const completedChecklistCount = opp.checklist ? opp.checklist.filter((c) => c.done).length : 0;
              const totalChecklistCount = opp.checklist ? opp.checklist.length : 0;

              return (
                <motion.div
                  key={opp.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
                  } hover:border-slate-700/60 transition-colors relative group overflow-hidden`}
                >
                  <div>
                    {/* Status & Countdown Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusStyle(opp.status)}`}>
                        {opp.status}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                            daysRemaining <= 3
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                              : daysRemaining <= 7
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-850 text-slate-400'
                          }`}
                        >
                          {daysRemaining < 0 ? 'EXPIRED' : daysRemaining === 0 ? 'DUE TODAY' : `${daysRemaining}D LEFT`}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${getPriorityStyle(opp.priority)}`}>
                          {opp.priority}
                        </span>
                      </div>
                    </div>

                    {/* Company Logo & Title */}
                    <div className="flex items-start gap-3">
                      <div className={`h-11 w-11 rounded-xl shrink-0 flex items-center justify-center font-display font-black text-sm select-none ${logo.bg} ${logo.color}`}>
                        {logo.text}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base text-slate-100 leading-snug truncate group-hover:text-indigo-300 transition-colors">
                          {opp.title}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-400">{opp.organization}</p>
                      </div>
                    </div>

                    {/* Pipeline Progress Rail */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[8px] font-semibold uppercase tracking-wider text-slate-500">
                        <span>Pipeline Stage</span>
                        <span className="text-slate-400">{opp.status}</span>
                      </div>
                      <div className="flex items-center gap-1 h-1.5">
                        {progressSteps.map((step, idx) => {
                          const isActive = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          return (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                isCurrent
                                  ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                                  : isActive
                                  ? 'bg-indigo-500/40'
                                  : 'bg-slate-800'
                              }`}
                              title={step}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Auto-Extracted Parameters Summary Section */}
                    <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/40">
                      {/* Skills Chips */}
                      {opp.skills && opp.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opp.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                          {opp.skills.length > 4 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              +{opp.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Checklist Progress */}
                      {totalChecklistCount > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckSquare className="h-3 w-3 text-indigo-400" /> Checklist
                          </span>
                          <span className="font-mono text-xs font-bold text-indigo-300">
                            {completedChecklistCount}/{totalChecklistCount}
                          </span>
                        </div>
                      )}

                      {/* Resume Version */}
                      {opp.resumeVersion && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <FileCheck className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="font-mono truncate">{opp.resumeVersion}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {opp.tags && opp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-400">
                          {opp.tags.map((tag) => (
                            <span key={tag} className="text-slate-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Eligibility Snippet */}
                      {opp.eligibility && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 italic">
                          <strong className="text-slate-300 not-italic">Eligibility:</strong> {opp.eligibility}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/25">
                    <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Globe className="h-3 w-3 text-indigo-400" /> via {opp.source || 'Direct Entry'}
                    </span>
                    <div className="flex items-center gap-1">
                      {opp.applicationLink && (
                        <a
                          href={opp.applicationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all"
                          title="Open application link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleStartEdit(opp)}
                        className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Edit opportunity"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteOpportunity(opp.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete opportunity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      </div>

      {/* MOBILE OPPORTUNITIES VIEW (Visible ONLY on screens < 768px) */}
      <div className="block md:hidden space-y-5 w-full max-w-xl mx-auto pb-32">
        {/* Mobile Header */}
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h1 className="font-display text-xl font-bold text-slate-100">Opportunity Ledger</h1>
            </div>
            <button
              type="button"
              onClick={handleStartCreate}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer min-h-[44px]"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2.5 pt-1">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search roles, companies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium focus:outline-none ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium focus:outline-none ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Opportunities Cards List */}
        <div className="space-y-4">
          {filteredOpps.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <Filter className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300">No matching opportunities</p>
              <p className="text-[11px] text-slate-500 mt-1">Tap "New" to capture a target role.</p>
            </div>
          ) : (
            filteredOpps.map((opp) => {
              const deadlineDate = new Date(opp.deadline);
              const today = new Date();
              const diffTime = deadlineDate.getTime() - today.getTime();
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExpanded = !!expandedCardIds[opp.id];

              const progressSteps: StatusType[] = ['Saved', 'Applied', 'Under Review', 'Interview', 'Selected'];
              const currentStepIndex = progressSteps.indexOf(opp.status as StatusType);

              const completedChecklistCount = opp.checklist ? opp.checklist.filter((c) => c.done).length : 0;
              const totalChecklistCount = opp.checklist ? opp.checklist.length : 0;

              return (
                <div
                  key={opp.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
                  } space-y-3 overflow-hidden`}
                >
                  {/* INITIALLY DISPLAYED COMPACT HEADER (Reduced card height) */}
                  <div
                    onClick={() => toggleCardExpanded(opp.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCardExpanded(opp.id)}
                    className="cursor-pointer space-y-2.5 focus:outline-none min-h-[44px]"
                  >
                    {/* Top Row: Status, Priority, Deadline Badges */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${getStatusStyle(opp.status)}`}>
                          {opp.status}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${getPriorityStyle(opp.priority)}`}>
                          {opp.priority}
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded ${
                        daysRemaining <= 3
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : daysRemaining <= 7
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {daysRemaining < 0 ? 'Expired' : daysRemaining === 0 ? 'Due Today' : `${daysRemaining}d left`} ({opp.deadline})
                      </span>
                    </div>

                    {/* Main Info: Opportunity Name & Organization */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <h3 className="font-bold text-sm text-slate-100 truncate leading-snug">
                          {opp.title}
                        </h3>
                        <p className="text-xs font-medium text-indigo-400 truncate mt-0.5">
                          {opp.organization} · <span className="text-slate-500 font-normal">{opp.category}</span>
                        </p>
                      </div>

                      {/* Expand / Collapse Icon Touch Target */}
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        className="h-9 w-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300 shrink-0 cursor-pointer min-h-[36px]"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-400" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Tap Indicator Hint when compact */}
                    {!isExpanded && (
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/30">
                        <span>Tap for Timeline, Checklist & AI Rec</span>
                        <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                          Expand <ChevronDown className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* EXPANDED CONTENT (Tap to expand) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-slate-800/60 space-y-4"
                      >
                        {/* 1. TIMELINE */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                            <span className="flex items-center gap-1.5 text-indigo-400">
                              <Calendar className="h-3.5 w-3.5" /> Timeline
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Applied: {opp.applyDate}</span>
                          </div>

                          {/* Pipeline Stage Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-400">
                              <span>Stage: <strong className="text-indigo-300">{opp.status}</strong></span>
                              <span>Deadline: <strong className="text-slate-300">{opp.deadline}</strong></span>
                            </div>
                            <div className="flex items-center gap-1 h-2">
                              {progressSteps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                return (
                                  <div
                                    key={step}
                                    className={`h-full flex-1 rounded-full ${
                                      isCurrent
                                        ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                                        : isActive
                                        ? 'bg-indigo-500/40'
                                        : 'bg-slate-800'
                                    }`}
                                    title={step}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 2. CHECKLIST */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                            <span className="flex items-center gap-1.5 text-indigo-400">
                              <ListChecks className="h-3.5 w-3.5" /> Checklist
                            </span>
                            <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                              {completedChecklistCount}/{totalChecklistCount} Done
                            </span>
                          </div>

                          <div className="space-y-2">
                            {totalChecklistCount === 0 ? (
                              <p className="text-[11px] text-slate-500 italic">No checklist items logged for this role.</p>
                            ) : (
                              opp.checklist?.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleToggleMobileChecklist(opp, item.id)}
                                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 min-h-[44px] cursor-pointer"
                                >
                                  <div className={`h-5 w-5 rounded flex items-center justify-center border shrink-0 ${
                                    item.done ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                                  }`}>
                                    {item.done && <Check className="h-3.5 w-3.5" />}
                                  </div>
                                  <span className={`text-xs ${item.done ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}`}>
                                    {item.label}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* 3. NOTES */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <FileText className="h-3.5 w-3.5 text-purple-400" /> Notes
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                            {opp.notes || 'No preparation notes attached.'}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Source Platform: <span className="text-slate-300">{opp.source || 'Direct Portal'}</span>
                          </div>
                        </div>

                        {/* 4. RESUME VERSION */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <FileCheck className="h-3.5 w-3.5 text-emerald-400" /> Resume Version
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-lg">
                            <FileCheck className="h-4 w-4 shrink-0" />
                            <span className="truncate">{opp.resumeVersion || 'Resume_V3_SWE.pdf'}</span>
                          </div>
                        </div>

                        {/* 5. AI RECOMMENDATION */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                              <Bot className="h-4 w-4 text-indigo-400" /> AI Recommendation
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                              Target Score: 92%
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            High potential fit for <strong>{opp.organization}</strong>. Match keywords with skills listed ({opp.skills?.slice(0, 3).join(', ') || 'core skills'}). Keep resume version <strong>{opp.resumeVersion || 'V3'}</strong> updated and submit before <strong>{opp.deadline}</strong>.
                          </p>
                        </div>

                        {/* 6. PREPARATION */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <Zap className="h-3.5 w-3.5 text-amber-400" /> Preparation
                          </div>

                          {/* Target Skills */}
                          {opp.skills && opp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {opp.skills.map((s) => (
                                <span key={s} className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Eligibility */}
                          {opp.eligibility && (
                            <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                              <strong className="text-slate-300">Eligibility:</strong> {opp.eligibility}
                            </p>
                          )}

                          {/* Touch Action Buttons */}
                          <div className="pt-2 flex items-center gap-2">
                            {opp.applicationLink && (
                              <a
                                href={opp.applicationLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4" /> Apply Portal
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEdit(opp)}
                              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] border border-slate-700 cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteOpportunity(opp.id)}
                              className="py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] border border-rose-500/20 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FULL SMART OPPORTUNITY CAPTURE FORM MODAL DIALOG */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="opp-form-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 border-slate-800 text-slate-100'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              } backdrop-blur-md z-10 max-h-[92vh] overflow-y-auto`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" aria-hidden="true" />
                  <h3 id="opp-form-modal-title" className="font-display font-bold text-lg">
                    {editingOpp ? 'Refine Opportunity Details' : 'Smart Opportunity Capture Ledger'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Close modal form"
                  className={`p-1.5 rounded-lg hover:bg-slate-800/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Auto-Fill Banner Success Alert */}
              {autoFillBanner && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2" role="status" aria-live="polite">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>✨ Auto-Extracted 13 Fields:</strong> Title, Company, Category, Deadline, Platform, Skills, Eligibility, Priority, Checklist, Status, Documents, Resume Version & Tags populated!
                  </span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* 1. Title & Company (Organization) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="opp-form-title" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                      <Briefcase className="h-3 w-3 text-indigo-400" aria-hidden="true" /> Title / Role Name *
                    </label>
                    <input
                      id="opp-form-title"
                      type="text"
                      required
                      placeholder="e.g. Software Engineering Intern"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="opp-form-org" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                      <Building2 className="h-3 w-3 text-indigo-400" aria-hidden="true" /> Company / Organization *
                    </label>
                    <input
                      id="opp-form-org"
                      type="text"
                      required
                      placeholder="e.g. Google"
                      value={formOrganization}
                      onChange={(e) => setFormOrganization(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Category, Platform & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="opp-form-category" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                      Category
                    </label>
                    <select
                      id="opp-form-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="opp-form-source" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                      Platform / Source
                    </label>
                    <input
                      id="opp-form-source"
                      type="text"
                      placeholder="e.g. Google Careers, Devpost"
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="opp-form-priority" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                      Priority Rank
                    </label>
                    <select
                      id="opp-form-priority"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as PriorityType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* 3. Status & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="opp-form-status" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                      Pipeline Status
                    </label>
                    <select
                      id="opp-form-status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as StatusType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="opp-form-deadline" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                      <Calendar className="h-3 w-3 text-indigo-400" aria-hidden="true" /> Application Deadline *
                    </label>
                    <input
                      id="opp-form-deadline"
                      type="date"
                      required
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>
                </div>

                {/* 4. Skills Extracted */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <label htmlFor="opp-form-new-skill" className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center justify-between cursor-pointer">
                    <span>Skills Required</span>
                    <span className="text-slate-500 font-mono text-[9px]">{formSkills.length} items</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {formSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center gap-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove skill ${skill}`}
                          className="hover:text-rose-400 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="opp-form-new-skill"
                      type="text"
                      placeholder="Add new skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      aria-label="Add skill"
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* 5. Eligibility Criteria */}
                <div className="space-y-1">
                  <label htmlFor="opp-form-eligibility" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Eligibility Criteria
                  </label>
                  <textarea
                    id="opp-form-eligibility"
                    rows={2}
                    placeholder="e.g. Enrolled in BS/MS CS or STEM major graduating 2025-2027..."
                    value={formEligibility}
                    onChange={(e) => setFormEligibility(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* 6. Preparation Checklist */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <label htmlFor="opp-form-new-checklist" className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" /> Action Checklist
                    </span>
                    <span className="text-slate-500 font-mono text-[9px]">
                      {formChecklist.filter((c) => c.done).length}/{formChecklist.length} done
                    </span>
                  </label>
                  <div className="space-y-1.5">
                    {formChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          aria-label={`Toggle checklist item ${item.label}`}
                          className={`flex items-center gap-2 cursor-pointer text-left flex-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                            item.done ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center ${
                              item.done ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                            }`}
                          >
                            {item.done && <Check className="h-3 w-3" aria-hidden="true" />}
                          </div>
                          <span>{item.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          aria-label={`Remove checklist item ${item.label}`}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="opp-form-new-checklist"
                      type="text"
                      placeholder="Add checklist action..."
                      value={newChecklistInput}
                      onChange={(e) => setNewChecklistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      aria-label="Add checklist action"
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Add Action
                    </button>
                  </div>
                </div>

                {/* 7. Resume Version & Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="opp-form-resume" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                      <FileCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Resume Version
                    </label>
                    <select
                      id="opp-form-resume"
                      value={formResumeVersion}
                      onChange={(e) => setFormResumeVersion(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="Resume_V3_SWE.pdf">Resume_V3_SWE.pdf</option>
                      <option value="Resume_V3_Google_SWE.pdf">Resume_V3_Google_SWE.pdf</option>
                      <option value="Research_CV_Adobe2026.pdf">Research_CV_Adobe2026.pdf</option>
                      <option value="General_Tech_v2.pdf">General_Tech_v2.pdf</option>
                      <option value="Hackathon_Project_Resume.pdf">Hackathon_Project_Resume.pdf</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 block">
                      <Paperclip className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Attached Documents
                    </span>
                    <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-slate-950/40 border border-slate-800 min-h-[38px]">
                      {formDocuments.map((doc) => (
                        <span
                          key={doc}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1"
                        >
                          {doc}
                          <button
                            type="button"
                            onClick={() => removeDocument(doc)}
                            aria-label={`Remove document ${doc}`}
                            className="hover:text-rose-400 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 8. Tags */}
                <div className="space-y-1">
                  <label htmlFor="opp-form-new-tag" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 cursor-pointer">
                    <Tag className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" /> Taxonomy Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {formTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                          className="hover:text-rose-400 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="opp-form-new-tag"
                      type="text"
                      placeholder="e.g. #google #internship2026"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      aria-label="Add tag"
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* 9. Application Portal URL & Notes */}
                <div className="space-y-1">
                  <label htmlFor="opp-form-app-link" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                    Application Portal URL
                  </label>
                  <input
                    id="opp-form-app-link"
                    type="url"
                    placeholder="https://..."
                    value={formAppLink}
                    onChange={(e) => setFormAppLink(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="opp-form-notes" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block cursor-pointer">
                    Preparation Notes & Strategy
                  </label>
                  <textarea
                    id="opp-form-notes"
                    rows={2}
                    placeholder="Auto-extracted specifications or custom preparation notes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-600'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all glow-blue flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    {editingOpp ? 'Apply Changes' : 'Save Opportunity Record'}
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
