import {
  Opportunity,
  TimelineEntry,
  DailyProgress,
  Certificate,
  Note,
  ActivityLog,
  AppNotification,
} from '../types';
import { logOpportunityDebug } from './opportunityDebug';
import type { ExternalConnection } from '../services/integrations/contracts/Connection';

// Storage Keys
const KEYS = {
  OPPORTUNITIES: 'career_os_opportunities',
  TIMELINE: 'career_os_timeline',
  PROGRESS: 'career_os_progress',
  CERTIFICATES: 'career_os_certificates',
  NOTES: 'career_os_notes',
  ACTIVITIES: 'career_os_activities',
  NOTIFICATIONS: 'career_os_notifications',
  THEME: 'career_os_theme',
  CONNECTIONS: 'career_os_connections',
};

// Seed Data
const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Software Engineering Intern',
    organization: 'Google',
    category: 'Internship',
    source: 'Google Careers',
    applicationLink: 'https://careers.google.com',
    applyDate: '2026-06-15',
    deadline: '2026-07-15',
    status: 'Interview',
    priority: 'High',
    notes: 'Technical screen scheduled for next week. Reviewing Graphs, Dynamic Programming, and System Design basics.',
  },
  {
    id: 'opp-2',
    title: 'Adobe Design Fellowship',
    organization: 'Adobe',
    category: 'Fellowship',
    source: 'LinkedIn',
    applicationLink: 'https://adobe.com/fellows',
    applyDate: '2026-06-20',
    deadline: '2026-07-10',
    status: 'Applied',
    priority: 'High',
    notes: 'Submitted portfolio showcasing modern glassmorphic dashboard concepts and clean user workflows.',
  },
  {
    id: 'opp-3',
    title: 'Global Hackathon 2026',
    organization: 'GitHub',
    category: 'Hackathon',
    source: 'Devpost',
    applicationLink: 'https://devpost.com',
    applyDate: '2026-06-25',
    deadline: '2026-07-02',
    status: 'Under Review',
    priority: 'Medium',
    notes: 'Built a collaborative real-time code auditor using AI. Expecting results in 3 days.',
  },
  {
    id: 'opp-4',
    title: 'AWS cloud Practitioner Certification',
    organization: 'Amazon Web Services',
    category: 'Certification',
    source: 'AWS Training',
    applicationLink: 'https://aws.training',
    applyDate: '2026-06-10',
    deadline: '2026-06-28',
    status: 'Completed',
    priority: 'Medium',
    notes: 'Completed all preparation modules. Scored 840/1000 in the final exam!',
  },
  {
    id: 'opp-5',
    title: 'Product Management Fellowship',
    organization: 'KPCB',
    category: 'Fellowship',
    source: 'KPCB Website',
    applicationLink: 'https://kpcbfellows.com',
    applyDate: '2026-06-28',
    deadline: '2026-07-25',
    status: 'Saved',
    priority: 'High',
    notes: 'Requires a 1-page essay on product improvements for a popular consumer application.',
  },
];

const SEED_TIMELINE: TimelineEntry[] = [
  {
    id: 'tl-1',
    date: '2026-06-28',
    learned: 'Deep dive into React 19 features including compiler changes and form actions. Mastered Tailwind CSS v4 custom theme extension config.',
    built: 'Completed CareerOS Lite interface with premium sidebar transitions and smooth Framer Motion list stagger animations.',
    applications: ['Product Management Fellowship (KPCB)'],
    certificates: ['React Advanced Certification'],
    codingPractice: 'Completed 3 LeetCode Medium questions (2 Graphs, 1 Dynamic Programming). Focus on BFS search optimization.',
    achievements: 'Reached a 14-day coding streak on GitHub and CareerOS!',
  },
  {
    id: 'tl-2',
    date: '2026-06-26',
    learned: 'Explored AWS S3, CloudFront and IAM policy configuration for securing static media uploads.',
    built: 'Engineered a highly customizable drag-and-drop file upload component supporting data URL translation.',
    applications: ['Adobe Design Fellowship'],
    certificates: [],
    codingPractice: 'Solved LeetCode 121 (Best Time to Buy and Sell Stock) and 122 using Greedy approach. 1 hour.',
    achievements: 'GitHub Hackathon submission completed!',
  },
  {
    id: 'tl-3',
    date: '2026-06-24',
    learned: 'Reviewed sorting algorithms: QuickSort, MergeSort and HeapSort complexities and stable vs unstable characteristics.',
    built: 'Refactored notes page to support rich markdown rendering with dynamic checkbox tracking.',
    applications: [],
    certificates: ['AWS Certified Cloud Practitioner'],
    codingPractice: 'Implemented a custom heap class in TypeScript to solve top K frequent elements. 2 hours.',
    achievements: 'Passed AWS Certified Cloud Practitioner exam on first attempt!',
  },
];

// Seed Daily Progress for 14 days
const generateSeedProgress = (): DailyProgress[] => {
  const progress: DailyProgress[] = [];
  const today = new Date('2026-06-29');

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateString = d.toISOString().split('T')[0];

    // Create realistic fluctuating numbers
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const multiplier = isWeekend ? 1.5 : 1.0;

    progress.push({
      date: dateString,
      dsaQuestions: Math.floor((isWeekend ? 4 : 2) * (0.8 + Math.random() * 0.4)),
      codingHours: parseFloat(((isWeekend ? 6 : 3.5) * (0.7 + Math.random() * 0.6)).toFixed(1)),
      webDevHours: parseFloat(((isWeekend ? 3 : 2) * (0.6 + Math.random() * 0.8)).toFixed(1)),
      pythonHours: parseFloat(((isWeekend ? 1 : 1.5) * (0.5 + Math.random() * 1.0)).toFixed(1)),
      applicationsCount: i === 1 ? 1 : i === 3 ? 1 : i === 9 ? 1 : i === 14 ? 1 : 0,
      readingMinutes: Math.floor((isWeekend ? 45 : 20) * (0.8 + Math.random() * 0.4)),
      projectsHours: parseFloat(((isWeekend ? 2.5 : 1) * (0.7 + Math.random() * 0.6)).toFixed(1)),
    });
  }
  return progress;
};

const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    name: 'AWS Certified Cloud Practitioner',
    platform: 'Amazon Web Services',
    date: '2026-06-24',
    category: 'Cloud Computing',
    notes: 'Covered core AWS services, pricing structures, architectural principles, security policies, and IAM configurations.',
    fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect width="100%" height="100%" fill="%230f172a"/><rect x="15" y="15" width="370" height="250" fill="none" stroke="%233b82f6" stroke-width="2" rx="4"/><circle cx="200" cy="90" r="35" fill="%232563eb"/><path d="M185 90h30l-15-25z" fill="%23fff"/><text x="200" y="160" fill="%23fff" font-family="sans-serif" font-size="18" text-anchor="middle" font-weight="bold">AWS Cloud Practitioner</text><text x="200" y="185" fill="%2394a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">Amazon Web Services</text><text x="200" y="210" fill="%2310b981" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold">VERIFIED CERTIFICATE</text><text x="200" y="235" fill="%2364748b" font-family="sans-serif" font-size="9" text-anchor="middle">Issued: June 24, 2026 • ID: AWS-77492-B</text></svg>',
  },
  {
    id: 'cert-2',
    name: 'Advanced React & Web Architecture',
    platform: 'Frontend Masters',
    date: '2026-06-28',
    category: 'Web Development',
    notes: 'Intensive curriculum covering React 19 Concurrent Features, Fiber reconciler internals, custom hook state patterns, and edge caching.',
    fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect width="100%" height="100%" fill="%230f172a"/><rect x="15" y="15" width="370" height="250" fill="none" stroke="%23ec4899" stroke-width="2" rx="4"/><circle cx="200" cy="90" r="35" fill="%23db2777"/><text x="200" y="98" fill="%23fff" font-family="sans-serif" font-size="24" text-anchor="middle" font-weight="bold">⚛</text><text x="200" y="160" fill="%23fff" font-family="sans-serif" font-size="18" text-anchor="middle" font-weight="bold">Advanced React Architect</text><text x="200" y="185" fill="%2394a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">Frontend Masters</text><text x="200" y="210" fill="%2310b981" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold">VERIFIED ACADEMIC CREDENTIAL</text><text x="200" y="235" fill="%2364748b" font-family="sans-serif" font-size="9" text-anchor="middle">Issued: June 28, 2026 • ID: FM-99201-A</text></svg>',
  },
];

const SEED_NOTES: Note[] = [
  {
    id: 'note-1',
    title: '📌 Core DSA Topic Review Checklist',
    content: `### LeetCode High Frequency Topics

- [x] **Sliding Window** (Dynamic size, fixed size, minimum substrings)
- [x] **Two Pointers** (Container with most water, 3Sum, trapping rainwater)
- [ ] **Binary Search** (Search in rotated sorted array, search element in matrix)
- [x] **Graphs** (BFS, DFS, Dijkstra, Union Find for connected components)
- [ ] **Dynamic Programming** (Knapsack, Longest Common Subsequence, Edit Distance)

### Study Priority Rules
1. Focus on understanding the **recursive tree** in DP before attempting memoization.
2. For graph problems, start with BFS for shortest paths, and DFS for connectivity.
3. Optimize time complexity first, then space complexity.`,
    tags: ['DSA', 'Interviews', 'Checklist'],
    updatedAt: new Date('2026-06-28T18:30:00.000Z').toISOString(),
    isPinned: true,
  },
  {
    id: 'note-2',
    title: '💡 Hackathon Pitch - DevSync AI',
    content: `### The Problem
Developer onboarding in startups is slow. Reading through 100+ files and documentation modules takes days.

### The Solution: DevSync AI
An AI agent that acts as a local repository peer, giving real-time interactive voice guides as developers navigate through codebases.

### Architecture Ideas
- **Frontend:** React + Tailwind CSS + Framer Motion (for smooth micro-interactions).
- **Backend:** Express proxy route for secure LLM vector analysis.
- **AI Engine:** Gemini 2.5 Flash for rapid file parsing and summary mapping.

### Core Visual Features
1. Left rail file explorer.
2. Floating glassmorphic Chat Assistant.
3. Pulse indicator highlighting the file currently discussed.`,
    tags: ['Hackathon', 'Ideas', 'AI'],
    updatedAt: new Date('2026-06-27T14:15:00.000Z').toISOString(),
    isPinned: false,
  },
  {
    id: 'note-3',
    title: '📝 Cold Email / Outreach Template',
    content: `### Subject: Student Researcher / SWE Interest - CareerOS Integration

Hello **[Recruiter / Engineer Name]**,

I hope you're having an excellent week! 

My name is **[Your Name]**, a computer science student passionate about developer tooling and productivity platforms. I've been following **[Company Name]**'s advancements in web infrastructure and loved the recent article on low-latency asset delivery.

I recently engineered **CareerOS Lite**, an offline-first workspace using React, TypeScript and Framer Motion that aggregates career pipelines with streak achievements. I'd love to discuss how I can bring this passion for high-performance frontend systems to the SWE Intern role at your team.

Attached is my portfolio. Would you be open to a 10-minute chat next Tuesday?

Best regards,  
**[Your Name]**`,
    tags: ['Templates', 'Outreach', 'JobHunt'],
    updatedAt: new Date('2026-06-25T09:00:00.000Z').toISOString(),
    isPinned: false,
  },
];

const SEED_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    timestamp: new Date('2026-06-28T22:30:00Z').toISOString(),
    type: 'opportunity',
    action: 'Saved Product Management Fellowship',
    details: 'Added KPCB opportunity to Saved list with priority High.',
  },
  {
    id: 'act-2',
    timestamp: new Date('2026-06-28T17:10:00Z').toISOString(),
    type: 'certificate',
    action: 'Uploaded React Advanced Certificate',
    details: 'Completed verified Frontend Masters certification curriculum.',
  },
  {
    id: 'act-3',
    timestamp: new Date('2026-06-28T16:00:00Z').toISOString(),
    type: 'progress',
    action: 'Completed Daily Progress Logging',
    details: 'Logged 3.5 coding hours, 2 DSA questions, and 2.5 project hours.',
  },
  {
    id: 'act-4',
    timestamp: new Date('2026-06-27T11:00:00Z').toISOString(),
    type: 'note',
    action: 'Updated Core DSA Review Checklist',
    details: 'Checked off Sliding Window and Graphs review objectives.',
  },
  {
    id: 'act-5',
    timestamp: new Date('2026-06-26T14:45:00Z').toISOString(),
    type: 'opportunity',
    action: 'Applied to Adobe Design Fellowship',
    details: 'Successfully submitted visual UI design portfolio.',
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'not-1',
    title: 'Google Interview Next Week!',
    message: 'Review technical notes for the scheduled Google Software Engineering Intern screen.',
    type: 'warning',
    date: '2026-06-29',
    read: false,
  },
  {
    id: 'not-2',
    title: 'Adobe Deadline Approaching',
    message: 'The Adobe Design Fellowship application deadline is in 11 days.',
    type: 'info',
    date: '2026-06-29',
    read: false,
  },
  {
    id: 'not-3',
    title: 'AWS Certificate Uploaded Successfully',
    message: 'Your Cloud Practitioner Certificate has been logged and is visible in your gallery.',
    type: 'success',
    date: '2026-06-28',
    read: true,
  },
];

// Helper to initialize local storage with clean empty states for new accounts
export const initializeStorage = (): void => {
  if (localStorage.getItem(KEYS.OPPORTUNITIES) === null) {
    localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.TIMELINE) === null) {
    localStorage.setItem(KEYS.TIMELINE, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.PROGRESS) === null) {
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.CERTIFICATES) === null) {
    localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.NOTES) === null) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.ACTIVITIES) === null) {
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.NOTIFICATIONS) === null) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (localStorage.getItem('career_os_dashboard_tasks') === null) {
    localStorage.setItem('career_os_dashboard_tasks', JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.CONNECTIONS) === null) {
    localStorage.setItem(KEYS.CONNECTIONS, JSON.stringify([]));
  }
};

// Reset all storage data to empty arrays for a fresh user account
export const resetStorageData = (): void => {
  const currentTheme = localStorage.getItem(KEYS.THEME);
  localStorage.clear();
  if (currentTheme) {
    localStorage.setItem(KEYS.THEME, currentTheme);
  }

  // Set clean empty state arrays
  localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify([]));
  localStorage.setItem(KEYS.TIMELINE, JSON.stringify([]));
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify([]));
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify([]));
  localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify([]));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(KEYS.CONNECTIONS, JSON.stringify([]));
  localStorage.setItem('career_os_dashboard_tasks', JSON.stringify([]));
  localStorage.setItem('career_os_opp_reminders', JSON.stringify({}));
  localStorage.setItem('career_os_user_name', 'Student');
  localStorage.setItem('career_os_user_school', 'Not Set');
  localStorage.setItem('career_os_user_grad', 'Not Set');
};

// Optionally load sample seed data if user requests it
export const loadSeedData = (): void => {
  localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify(SEED_OPPORTUNITIES));
  localStorage.setItem(KEYS.TIMELINE, JSON.stringify(SEED_TIMELINE));
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(generateSeedProgress()));
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(SEED_CERTIFICATES));
  localStorage.setItem(KEYS.NOTES, JSON.stringify(SEED_NOTES));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
};

// Generic Load / Save Helpers
const loadData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error loading key: ${key}`, e);
    return defaultValue;
  }
};

const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key: ${key}`, e);
  }
};

// --- OPPORTUNITIES CRUD ---
export const getOpportunities = (): Opportunity[] => loadData(KEYS.OPPORTUNITIES, []);
export const saveOpportunities = (opps: Opportunity[]): void => saveData(KEYS.OPPORTUNITIES, opps);
export const saveOpportunity = (opp: Opportunity): void => {
  const opps = getOpportunities();
  const index = opps.findIndex((o) => o.id === opp.id);
  if (index >= 0) {
    opps[index] = opp;
    addActivityLog('opportunity', `Updated opportunity: ${opp.title} at ${opp.organization}`, opp.notes);
  } else {
    opps.push(opp);
    addActivityLog('opportunity', `Created opportunity: ${opp.title} at ${opp.organization}`, opp.notes);
  }
  saveOpportunities(opps);
  logOpportunityDebug('Storage', 'src/utils/storage.ts', 'saveOpportunity', opp, getOpportunities().find((item) => item.id === opp.id));
  updateDeadlineNotifications();
};
export const deleteOpportunity = (id: string): void => {
  const opps = getOpportunities();
  const opp = opps.find((o) => o.id === id);
  if (opp) {
    addActivityLog('opportunity', `Deleted opportunity: ${opp.title} at ${opp.organization}`);
  }
  const filtered = opps.filter((o) => o.id !== id);
  saveOpportunities(filtered);
  updateDeadlineNotifications();
};

// --- TIMELINE (JOURNEY) CRUD ---
export const getTimelineEntries = (): TimelineEntry[] => loadData(KEYS.TIMELINE, []);
export const saveTimelineEntries = (entries: TimelineEntry[]): void => saveData(KEYS.TIMELINE, entries);
export const saveTimelineEntry = (entry: TimelineEntry): void => {
  const entries = getTimelineEntries();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = { ...entries[index], ...entry };
    addActivityLog('timeline', `Updated daily journey entry for ${entry.date}`);
  } else {
    entries.push(entry);
    addActivityLog('timeline', `Created daily journey entry for ${entry.date}`);
  }
  // Sort in descending order by date
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveTimelineEntries(entries);
};
export const deleteTimelineEntry = (id: string): void => {
  const entries = getTimelineEntries();
  const filtered = entries.filter((e) => e.id !== id);
  saveTimelineEntries(filtered);
};

// --- DAILY PROGRESS TRACKING ---
export const getDailyProgress = (): DailyProgress[] => loadData(KEYS.PROGRESS, []);
export const saveDailyProgressList = (list: DailyProgress[]): void => saveData(KEYS.PROGRESS, list);
export const updateDailyProgress = (progress: DailyProgress): void => {
  const list = getDailyProgress();
  const index = list.findIndex((p) => p.date === progress.date);
  if (index >= 0) {
    list[index] = progress;
  } else {
    list.push(progress);
  }
  // Sort by date ascending
  list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  saveDailyProgressList(list);
  addActivityLog('progress', `Logged today's productivity progress`, `DSA: ${progress.dsaQuestions} q, Coding: ${progress.codingHours} hrs`);
};

// --- CERTIFICATES CRUD ---
export const getCertificates = (): Certificate[] => loadData(KEYS.CERTIFICATES, []);
export const saveCertificates = (certs: Certificate[]): void => saveData(KEYS.CERTIFICATES, certs);
export const saveCertificate = (cert: Certificate): void => {
  const certs = getCertificates();
  const index = certs.findIndex((c) => c.id === cert.id);
  if (index >= 0) {
    certs[index] = cert;
    addActivityLog('certificate', `Updated certificate: ${cert.name}`);
  } else {
    certs.push(cert);
    addActivityLog('certificate', `Earned new certificate: ${cert.name} on ${cert.platform}`);

    // Create custom timeline entry or append to today's certificates if we want
    const todayStr = new Date().toISOString().split('T')[0];
    const timeline = getTimelineEntries();
    const todayTimelineIndex = timeline.findIndex((t) => t.date === todayStr);
    if (todayTimelineIndex >= 0) {
      if (!timeline[todayTimelineIndex].certificates.includes(cert.name)) {
        timeline[todayTimelineIndex].certificates.push(cert.name);
        saveTimelineEntries(timeline);
      }
    } else {
      saveTimelineEntry({
        id: `tl-auto-${Date.now()}`,
        date: todayStr,
        learned: `Completed the certification: ${cert.name} on ${cert.platform}.`,
        built: '',
        applications: [],
        certificates: [cert.name],
        codingPractice: '',
        achievements: `Earned certification in ${cert.name}!`,
      });
    }
  }
  saveCertificates(certs);
};
export const deleteCertificate = (id: string): void => {
  const certs = getCertificates();
  const cert = certs.find((c) => c.id === id);
  if (cert) {
    addActivityLog('certificate', `Removed certificate: ${cert.name}`);
  }
  const filtered = certs.filter((c) => c.id !== id);
  saveCertificates(filtered);
};

// --- NOTES CRUD ---
export const getNotes = (): Note[] => loadData(KEYS.NOTES, []);
export const saveNotes = (notes: Note[]): void => saveData(KEYS.NOTES, notes);
export const saveNote = (note: Note): void => {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.push(note);
    addActivityLog('note', `Created note: ${note.title}`);
  }
  saveNotes(notes);
};
export const deleteNote = (id: string): void => {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    addActivityLog('note', `Deleted note: ${note.title}`);
  }
  const filtered = notes.filter((n) => n.id !== id);
  saveNotes(filtered);
};

// --- CONNECTION METADATA ---
export const getConnections = (): ExternalConnection[] => loadData(KEYS.CONNECTIONS, []);
export const saveConnections = (connections: ExternalConnection[]): void => saveData(KEYS.CONNECTIONS, connections);

// --- ACTIVITY LOGS ---
export const getActivityLogs = (): ActivityLog[] => loadData(KEYS.ACTIVITIES, []);
export const addActivityLog = (type: ActivityLog['type'], action: string, details?: string): void => {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type,
    action,
    details,
  };
  logs.unshift(newLog); // Put newest first
  // Cap at 50 logs
  saveData(KEYS.ACTIVITIES, logs.slice(0, 50));
};

// --- NOTIFICATIONS ---
export const getNotifications = (): AppNotification[] => loadData(KEYS.NOTIFICATIONS, []);
export const saveNotifications = (notifications: AppNotification[]): void => saveData(KEYS.NOTIFICATIONS, notifications);
export const markNotificationRead = (id: string): void => {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index >= 0) {
    notifications[index].read = true;
    saveNotifications(notifications);
  }
};
export const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info'): void => {
  const notifications = getNotifications();
  const newNot: AppNotification = {
    id: `not-${Date.now()}`,
    title,
    message,
    type,
    date: new Date().toISOString().split('T')[0],
    read: false,
  };
  notifications.unshift(newNot);
  saveNotifications(notifications);
};

// Auto generate/update deadline warnings
const updateDeadlineNotifications = (): void => {
  const opps = getOpportunities();
  const notifications = getNotifications();
  const today = new Date();
  
  opps.forEach((opp) => {
    if (opp.status === 'Completed' || opp.status === 'Selected' || opp.status === 'Rejected') return;

    const deadlineDate = new Date(opp.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff > 0 && daysDiff <= 7) {
      const notId = `deadline-warn-${opp.id}`;
      // Check if alert already exists
      const exists = notifications.some((n) => n.id === notId);
      if (!exists) {
        notifications.unshift({
          id: notId,
          title: `Upcoming Deadline: ${opp.title}`,
          message: `${opp.organization} deadline is in ${daysDiff} days! Make sure to update your application status.`,
          type: 'warning',
          date: new Date().toISOString().split('T')[0],
          read: false,
        });
      }
    }
  });

  saveNotifications(notifications.slice(0, 30));
};

// --- IMPORT / EXPORT JSON ---
export const exportDataJSON = (): string => {
  const exportObject = {
    opportunities: getOpportunities(),
    timeline: getTimelineEntries(),
    progress: getDailyProgress(),
    certificates: getCertificates(),
    notes: getNotes(),
    activities: getActivityLogs(),
    notifications: getNotifications(),
  };
  return JSON.stringify(exportObject, null, 2);
};

export const importDataJSON = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (parsed.opportunities && Array.isArray(parsed.opportunities)) {
      saveData(KEYS.OPPORTUNITIES, parsed.opportunities);
    }
    if (parsed.timeline && Array.isArray(parsed.timeline)) {
      saveData(KEYS.TIMELINE, parsed.timeline);
    }
    if (parsed.progress && Array.isArray(parsed.progress)) {
      saveData(KEYS.PROGRESS, parsed.progress);
    }
    if (parsed.certificates && Array.isArray(parsed.certificates)) {
      saveData(KEYS.CERTIFICATES, parsed.certificates);
    }
    if (parsed.notes && Array.isArray(parsed.notes)) {
      saveData(KEYS.NOTES, parsed.notes);
    }
    if (parsed.activities && Array.isArray(parsed.activities)) {
      saveData(KEYS.ACTIVITIES, parsed.activities);
    }
    if (parsed.notifications && Array.isArray(parsed.notifications)) {
      saveData(KEYS.NOTIFICATIONS, parsed.notifications);
    }
    
    addActivityLog('note', 'Imported data from external backup JSON file');
    return true;
  } catch (e) {
    console.error('Failed to import JSON data', e);
    return false;
  }
};

// --- THEME ---
export const getSavedTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem(KEYS.THEME);
  if (saved === 'light' || saved === 'dark') return saved;
  // Default to dark mode for a premium startup vibe!
  return 'dark';
};

export const saveThemeSetting = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(KEYS.THEME, theme);
};
