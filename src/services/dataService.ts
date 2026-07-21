import { CanonicalCareerRepository } from './data/CanonicalCareerRepository';
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

const notifyDataChanged = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('career-os-data-changed'));
};

/**
 * Data Service Abstraction Layer
 * Prepares architecture for future backend API calls (REST/Firebase/Supabase)
 */
export const dataService = {
  repository: new CanonicalCareerRepository(),
  initialize(): void {
    this.repository.initialize();
  },

  fetchAllData(): AppDatabasePayload {
    return {
      opportunities: this.repository.getOpportunities(), timelineEntries: this.repository.getJourney(), progressData: this.repository.getProgress(), certificates: this.repository.getCertifications(), notes: this.repository.getNotes(), notifications: this.repository.getNotifications(), activities: this.repository.getActivities(),
      userName: localStorage.getItem('career_os_user_name') || 'Student',
      userSchool: localStorage.getItem('career_os_user_school') || 'Not Set',
      userGrad: localStorage.getItem('career_os_user_grad') || 'Not Set',
    };
  },

  // Opportunities
  saveOpportunity(opp: Opportunity): void {
    this.repository.saveOpportunity(opp);
    notifyDataChanged();
  },

  deleteOpportunity(id: string): void {
    this.repository.deleteOpportunity(id);
    notifyDataChanged();
  },

  // Timeline
  saveTimelineEntry(entry: TimelineEntry): void {
    this.repository.saveJourney(entry);
    notifyDataChanged();
  },

  deleteTimelineEntry(id: string): void {
    this.repository.deleteJourney(id);
    notifyDataChanged();
  },

  // Daily Progress
  updateDailyProgress(progress: DailyProgress): void {
    this.repository.saveProgress(progress);
    notifyDataChanged();
  },
  deleteDailyProgress(date: string): boolean {
    const deleted = this.repository.deleteProgress(date);
    if (deleted) notifyDataChanged();
    return deleted;
  },

  // Certificates
  saveCertificate(cert: Certificate): void {
    this.repository.saveCertification(cert);
    notifyDataChanged();
  },

  deleteCertificate(id: string): void {
    this.repository.deleteCertification(id);
    notifyDataChanged();
  },

  // Notes
  saveNote(note: Note): void {
    this.repository.saveNote(note);
    notifyDataChanged();
  },

  deleteNote(id: string): void {
    this.repository.deleteNote(id);
    notifyDataChanged();
  },

  // Notifications
  markNotificationRead(id: string): void {
    this.repository.markNotificationRead(id);
    notifyDataChanged();
  },

  // Account Reset / Seed Data
  resetData(): void {
    this.repository.reset();
    notifyDataChanged();
  },

  loadSeedData(): void {
    this.repository.loadSeedData();
    notifyDataChanged();
  },
};
