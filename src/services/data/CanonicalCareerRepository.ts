import { dataService } from '../dataService';
import type { CanonicalCareerData, CareerGoal, CareerLearning, CareerMission, CareerProject, CareerSkill } from '../../types/career-data';
import type { Task } from '../../types';

const KEYS = { skills: 'career_os_skills', learning: 'career_os_learning', goals: 'career_os_goals', missions: 'career_os_missions', projects: 'career_os_projects', tasks: 'career_os_dashboard_tasks' } as const;
const read = <T>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

/** Single canonical boundary for future AI extraction; migrates legacy task records on first read. */
export class CanonicalCareerRepository {
  getSnapshot(): CanonicalCareerData {
    const legacy = dataService.fetchAllData(); const now = new Date().toISOString();
    const goals = this.migrateGoals(read<CareerGoal[]>(KEYS.goals, []), read<Task[]>(KEYS.tasks, []), now);
    return { schemaVersion: 1, updatedAt: legacy.activities[0]?.timestamp ?? now, opportunities: legacy.opportunities, journey: legacy.timelineEntries, learning: read<CareerLearning[]>(KEYS.learning, []), skills: read<CareerSkill[]>(KEYS.skills, []), goals, missions: read<CareerMission[]>(KEYS.missions, []), projects: read<CareerProject[]>(KEYS.projects, []), certifications: legacy.certificates, notes: legacy.notes };
  }
  saveSkills(value: CareerSkill[]) { write(KEYS.skills, value); }
  saveLearning(value: CareerLearning[]) { write(KEYS.learning, value); }
  saveGoals(value: CareerGoal[]) { write(KEYS.goals, value); }
  saveMissions(value: CareerMission[]) { write(KEYS.missions, value); }
  saveProjects(value: CareerProject[]) { write(KEYS.projects, value); }
  private migrateGoals(goals: CareerGoal[], tasks: Task[], updatedAt: string): CareerGoal[] {
    if (goals.length) return goals;
    const migrated = tasks.map((task) => ({ id: task.id, title: task.text, status: task.completed ? 'completed' as const : 'active' as const, priority: 'medium' as const, dueDate: task.dueDate || undefined, updatedAt }));
    if (migrated.length) this.saveGoals(migrated); return migrated;
  }
}
