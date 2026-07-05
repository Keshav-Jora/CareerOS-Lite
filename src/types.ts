/**
 * CareerOS Lite Data Types
 */

export type CategoryType =
  | 'Internship'
  | 'Hackathon'
  | 'Competition'
  | 'Fellowship'
  | 'Scholarship'
  | 'Quiz'
  | 'Workshop'
  | 'Certification';

export type StatusType =
  | 'Saved'
  | 'Planned'
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Rejected'
  | 'Completed';

export type PriorityType = 'High' | 'Medium' | 'Low';

export interface Opportunity {
  id: string;
  title: string;
  organization: string; // Company
  category: CategoryType;
  source: string; // Platform
  applicationLink: string;
  applyDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  status: StatusType;
  priority: PriorityType;
  notes: string;
  // Smart Opportunity Capture auto-extracted fields
  skills?: string[];
  eligibility?: string;
  checklist?: { id: string; label: string; done: boolean }[];
  documents?: string[];
  resumeVersion?: string;
  tags?: string[];
}

export interface TimelineEntry {
  id: string;
  date: string; // YYYY-MM-DD
  learned: string;
  built: string;
  applications: string[]; // names of opportunities or manual titles
  certificates: string[]; // names of certificates earned
  codingPractice: string; // details of coding practice
  achievements: string; // achievements or milestones
  failures?: string;
  lessons?: string;
  isMajorMilestone?: boolean;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  dsaQuestions: number;
  codingHours: number;
  webDevHours: number;
  pythonHours: number;
  applicationsCount: number;
  readingMinutes: number;
  projectsHours: number;
}

export interface Certificate {
  id: string;
  name: string;
  platform: string;
  date: string; // YYYY-MM-DD
  category: string;
  notes: string;
  fileUrl?: string; // Base64 image/pdf representer
}

export interface Note {
  id: string;
  title: string;
  content: string; // Supports markdown
  tags: string[];
  updatedAt: string; // ISO String
  isPinned: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  type: 'opportunity' | 'timeline' | 'progress' | 'certificate' | 'note';
  action: string; // e.g. "Applied to Google SWE Internship"
  details?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string; // YYYY-MM-DD or time ago
  read: boolean;
}
