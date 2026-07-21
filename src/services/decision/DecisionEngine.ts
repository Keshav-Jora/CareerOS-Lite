import { dataService } from '../dataService';
import type { CanonicalCareerData } from '../../types/career-data';
import type { DailyProgress } from '../../types';

export type DecisionCategory = 'applications' | 'deadlines' | 'skills' | 'progress' | 'journey' | 'goals';
export interface DecisionRecommendation { id: string; category: DecisionCategory; priority: number; title: string; reason: string; relatedEntityId?: string; }

/** Deterministic, provider-independent recommendation engine. */
export class DecisionEngine {
  analyze(snapshot = dataService.repository.getSnapshot(), progress = dataService.repository.getProgress()): DecisionRecommendation[] {
    const recommendations = [
      ...this.deadlineAnalyzer(snapshot),
      ...this.opportunityAnalyzer(snapshot),
      ...this.goalAnalyzer(snapshot),
      ...this.progressAnalyzer(progress),
      ...this.journeyAnalyzer(snapshot),
      ...this.consistencyAnalyzer(snapshot),
    ];
    return this.priorityScorer(recommendations);
  }

  private goalAnalyzer(snapshot: CanonicalCareerData): DecisionRecommendation[] {
    return snapshot.goals.filter((goal) => goal.status === 'active').flatMap<DecisionRecommendation>((goal) => {
      const title = goal.title.toLowerCase();
      if (/ai|machine learning|ml/.test(title)) return [{ id: `goal-ai-${goal.id}`, category: 'skills' as const, priority: 78, title: 'Build an AI-focused project', reason: `Your active goal “${goal.title}” benefits from demonstrable Python, ML, and project experience.`, relatedEntityId: goal.id }];
      if (/full.?stack|mern|web/.test(title)) return [{ id: `goal-fullstack-${goal.id}`, category: 'skills' as const, priority: 76, title: 'Build and deploy a full-stack project', reason: `Your active goal “${goal.title}” needs backend and deployment evidence in your portfolio.`, relatedEntityId: goal.id }];
      return [{ id: `goal-progress-${goal.id}`, category: 'goals' as const, priority: goal.priority === 'high' ? 74 : 62, title: `Make progress on ${goal.title}`, reason: 'This is an active career goal without a more urgent deadline.', relatedEntityId: goal.id }];
    });
  }

  private opportunityAnalyzer(snapshot: CanonicalCareerData): DecisionRecommendation[] {
    return snapshot.opportunities.filter((item) => ['Saved', 'Interested'].includes(item.status)).map((item) => ({ id: `apply-${item.id}`, category: 'applications' as const, priority: item.priority === 'High' ? 82 : 68, title: `Review ${item.title}`, reason: `${item.organization || 'This opportunity'} is saved but has not been applied to yet.`, relatedEntityId: item.id }));
  }

  private deadlineAnalyzer(snapshot: CanonicalCareerData): DecisionRecommendation[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return snapshot.opportunities.flatMap((item) => {
      if (!item.deadline) return [];
      const deadline = new Date(`${item.deadline}T00:00:00`);
      if (Number.isNaN(deadline.getTime()) || ['Completed', 'Rejected'].includes(item.status)) return [];
      const days = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
      if (days < 0) return [{ id: `expired-${item.id}`, category: 'deadlines' as const, priority: 88, title: `Review expired ${item.title}`, reason: 'Its deadline has passed; archive it or update the deadline.', relatedEntityId: item.id }];
      if (days <= 7) return [{ id: `deadline-${item.id}`, category: 'deadlines' as const, priority: 100 - Math.min(days, 6), title: `Apply to ${item.title}`, reason: `Deadline is in ${days === 0 ? 'less than one day' : `${days} day${days === 1 ? '' : 's'}`}.`, relatedEntityId: item.id }];
      return [];
    });
  }

  private progressAnalyzer(progress: DailyProgress[]): DecisionRecommendation[] {
    const latest = progress.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest || latest.dsaQuestions === 0) return [{ id: 'practice-dsa', category: 'progress', priority: 95, title: 'Solve 5 DSA questions', reason: 'No DSA progress is recorded in your latest practice entry.' }];
    const days = Math.floor((Date.now() - new Date(`${latest.date}T00:00:00`).getTime()) / 86_400_000);
    return days >= 3 ? [{ id: 'resume-practice', category: 'progress', priority: 60, title: 'Resume a coding practice session', reason: `No practice has been logged for ${days} days.` }] : [];
  }

  private journeyAnalyzer(snapshot: CanonicalCareerData): DecisionRecommendation[] {
    const latest = snapshot.journey.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) return [{ id: 'log-journey', category: 'journey', priority: 58, title: 'Log a career milestone', reason: 'No journey milestone is recorded yet.' }];
    const days = Math.floor((Date.now() - new Date(`${latest.date}T00:00:00`).getTime()) / 86_400_000);
    return days >= 7 ? [{ id: 'journey-inactive', category: 'journey', priority: 60, title: 'Record recent learning or project progress', reason: `No journey milestone has been logged for ${days} days.` }] : [];
  }

  private consistencyAnalyzer(snapshot: CanonicalCareerData): DecisionRecommendation[] {
    const goalText = snapshot.goals.filter((goal) => goal.status === 'active').map((goal) => goal.title).join(' ').toLowerCase();
    const journeyText = snapshot.journey.map((entry) => `${entry.learned} ${entry.built}`).join(' ').toLowerCase();
    if (/ai|machine learning/.test(goalText) && !/python|machine learning|tensorflow|pytorch/.test(journeyText)) return [{ id: 'ai-skill-gap', category: 'skills', priority: 84, title: 'Close the AI skill gap', reason: 'Your AI-oriented goal has no related learning or project milestone yet.' }];
    return [];
  }

  private priorityScorer(items: DecisionRecommendation[]): DecisionRecommendation[] {
    const unique = new Map<string, DecisionRecommendation>();
    items.forEach((item) => { if (!unique.has(item.id)) unique.set(item.id, { ...item, priority: Math.max(0, Math.min(100, item.priority)) }); });
    return [...unique.values()].sort((left, right) => right.priority - left.priority || left.title.localeCompare(right.title));
  }
}
