import * as storage from '../utils/storage';
import {
  Opportunity,
  TimelineEntry,
  DailyProgress,
  Certificate,
  Note,
  AppNotification,
  ActivityLog,
} from '../types';

export interface AppDatabasePayload {
  opportunities: Opportunity[];
  timelineEntries: TimelineEntry[];
  progressData: DailyProgress[];
  certificates: Certificate[];
  notes: Note[];
  notifications: AppNotification[];
  activities: ActivityLog[];
  userName: string;
  userSchool: string;
  userGrad: string;
}

/**
 * Data Service Abstraction Layer
 * Prepares architecture for future backend API calls (REST/Firebase/Supabase)
 */
export const dataService = {
  initialize(): void {
    storage.initializeStorage();
  },

  fetchAllData(): AppDatabasePayload {
    return {
      opportunities: storage.getOpportunities(),
      timelineEntries: storage.getTimelineEntries(),
      progressData: storage.getDailyProgress(),
      certificates: storage.getCertificates(),
      notes: storage.getNotes(),
      notifications: storage.getNotifications(),
      activities: storage.getActivityLogs(),
      userName: localStorage.getItem('career_os_user_name') || 'Student',
      userSchool: localStorage.getItem('career_os_user_school') || 'Not Set',
      userGrad: localStorage.getItem('career_os_user_grad') || 'Not Set',
    };
  },

  // Opportunities
  saveOpportunity(opp: Opportunity): void {
    storage.saveOpportunity(opp);
  },

  deleteOpportunity(id: string): void {
    storage.deleteOpportunity(id);
  },

  // Timeline
  saveTimelineEntry(entry: TimelineEntry): void {
    storage.saveTimelineEntry(entry);
  },

  deleteTimelineEntry(id: string): void {
    storage.deleteTimelineEntry(id);
  },

  // Daily Progress
  updateDailyProgress(progress: DailyProgress): void {
    storage.updateDailyProgress(progress);
  },

  // Certificates
  saveCertificate(cert: Certificate): void {
    storage.saveCertificate(cert);
  },

  deleteCertificate(id: string): void {
    storage.deleteCertificate(id);
  },

  // Notes
  saveNote(note: Note): void {
    storage.saveNote(note);
  },

  deleteNote(id: string): void {
    storage.deleteNote(id);
  },

  // Notifications
  markNotificationRead(id: string): void {
    storage.markNotificationRead(id);
  },

  // Account Reset / Seed Data
  resetData(): void {
    storage.resetStorageData();
  },

  loadSeedData(): void {
    storage.loadSeedData();
  },
};
