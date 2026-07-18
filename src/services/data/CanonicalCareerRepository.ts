import * as storage from '../../utils/storage';
import type { CanonicalCareerData, CareerGoal, CareerLearning, CareerMission, CareerProject, CareerSkill } from '../../types/career-data';
import type { ActivityLog, AppNotification, Certificate, DailyProgress, Note, Opportunity, Task, TimelineEntry } from '../../types';

const KEYS = { skills: 'career_os_skills', learning: 'career_os_learning', goals: 'career_os_goals', missions: 'career_os_missions', projects: 'career_os_projects', tasks: 'career_os_dashboard_tasks' } as const;
const read = <T>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

/** Single canonical boundary for future AI extraction; migrates legacy task records on first read. */
export class CanonicalCareerRepository {
  getSnapshot(): CanonicalCareerData {
    const legacy = this.getLegacySnapshot(); const now = new Date().toISOString();
    const goals = this.migrateGoals(read<CareerGoal[]>(KEYS.goals, []), read<Task[]>(KEYS.tasks, []), now);
    return { schemaVersion: 1, updatedAt: legacy.activities[0]?.timestamp ?? now, opportunities: legacy.opportunities, journey: legacy.timelineEntries, learning: read<CareerLearning[]>(KEYS.learning, []), skills: read<CareerSkill[]>(KEYS.skills, []), goals, missions: read<CareerMission[]>(KEYS.missions, []), projects: read<CareerProject[]>(KEYS.projects, []), certifications: legacy.certificates, notes: legacy.notes };
  }
  saveSkills(value: CareerSkill[]) { write(KEYS.skills, value); }
  saveLearning(value: CareerLearning[]) { write(KEYS.learning, value); }
  saveGoals(value: CareerGoal[]) { write(KEYS.goals, value); }
  saveMissions(value: CareerMission[]) { write(KEYS.missions, value); }
  saveProjects(value: CareerProject[]) { write(KEYS.projects, value); }
  restoreSnapshot(snapshot: CanonicalCareerData): void {
    snapshot.opportunities.forEach((value) => this.saveOpportunity(value)); snapshot.journey.forEach((value) => this.saveJourney(value)); snapshot.certifications.forEach((value) => this.saveCertification(value)); snapshot.notes.forEach((value) => this.saveNote(value));
    this.saveSkills(snapshot.skills); this.saveLearning(snapshot.learning); this.saveGoals(snapshot.goals); this.saveMissions(snapshot.missions); this.saveProjects(snapshot.projects);
  }
  getOpportunities(): Opportunity[] { return storage.getOpportunities(); }
  saveOpportunity(value: Opportunity): void { storage.saveOpportunity(value); }
  deleteOpportunity(id: string): void { storage.deleteOpportunity(id); }
  getJourney(): TimelineEntry[] { return storage.getTimelineEntries(); }
  saveJourney(value: TimelineEntry): void { storage.saveTimelineEntry(value); }
  deleteJourney(id: string): void { storage.deleteTimelineEntry(id); }
  getProgress(): DailyProgress[] { return storage.getDailyProgress(); }
  saveProgress(value: DailyProgress): void { storage.updateDailyProgress(value); }
  getCertifications(): Certificate[] { return storage.getCertificates(); }
  saveCertification(value: Certificate): void { storage.saveCertificate(value); }
  deleteCertification(id: string): void { storage.deleteCertificate(id); }
  getNotes(): Note[] { return storage.getNotes(); }
  saveNote(value: Note): void { storage.saveNote(value); }
  deleteNote(id: string): void { storage.deleteNote(id); }
  getNotifications(): AppNotification[] { return storage.getNotifications(); }
  getActivities(): ActivityLog[] { return storage.getActivityLogs(); }
  markNotificationRead(id: string): void { storage.markNotificationRead(id); }
  initialize(): void { storage.initializeStorage(); }
  reset(): void { storage.resetStorageData(); }
  loadSeedData(): void { storage.loadSeedData(); }
  private getLegacySnapshot(): { opportunities: Opportunity[]; timelineEntries: TimelineEntry[]; progressData: DailyProgress[]; certificates: Certificate[]; notes: Note[]; notifications: AppNotification[]; activities: ActivityLog[] } {
    return { opportunities: this.getOpportunities(), timelineEntries: this.getJourney(), progressData: this.getProgress(), certificates: this.getCertifications(), notes: this.getNotes(), notifications: this.getNotifications(), activities: this.getActivities() };
  }
  private migrateGoals(goals: CareerGoal[], tasks: Task[], updatedAt: string): CareerGoal[] {
    if (goals.length) return goals;
    const migrated = tasks.map((task) => ({ id: task.id, title: task.text, status: task.completed ? 'completed' as const : 'active' as const, priority: 'medium' as const, dueDate: task.dueDate || undefined, updatedAt }));
    if (migrated.length) this.saveGoals(migrated); return migrated;
  }
}
