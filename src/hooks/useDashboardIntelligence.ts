import { useMemo } from 'react';
import { CareerIntelligenceEngine } from '../ai/intelligence';
import type { CareerRecommendation, RecommendationPriority } from '../ai/intelligence';
import type { ActivityLog, Certificate, DailyProgress, Note, Opportunity, TimelineEntry } from '../types';

export interface FeaturedOpportunity {
  opportunity: Opportunity;
  reason: string;
  matchScore: number | null;
  requiredSkills: string[];
  daysUntilDeadline: number | null;
}

interface DashboardIntelligenceInput {
  opportunities: Opportunity[];
  timelineEntries: TimelineEntry[];
  progress: DailyProgress[];
  certificates: Certificate[];
  notes: Note[];
  activities: ActivityLog[];
  userName: string;
}

export interface DashboardIntelligenceViewModel {
  recommendation: CareerRecommendation;
  confidence: number;
  weeklyTrend: number;
  weeklyProgress: number;
  streak: number;
  estimatedDuration: string;
  expectedImpact: string;
  featuredOpportunity: FeaturedOpportunity | null;
  latestActivity: ActivityLog | null;
}

/** Presentation adapter for the homepage; the intelligence engine remains UI-agnostic. */
export function useDashboardIntelligence(input: DashboardIntelligenceInput): DashboardIntelligenceViewModel {
  return useMemo(() => {
    const recommendation = new CareerIntelligenceEngine().generateFrom({
      opportunities: input.opportunities,
      timelineEntries: input.timelineEntries,
      progressData: input.progress,
      certificates: input.certificates,
      notes: input.notes,
      userName: input.userName,
    });
    const activeDaysThisWeek = countActiveDays(input.progress, 0, 7);
    const weeklyHours = sumCodingHours(input.progress, 0, 7);
    const previousWeeklyHours = sumCodingHours(input.progress, 7, 14);

    return {
      recommendation,
      confidence: calculateConfidence(input),
      weeklyTrend: Math.round(weeklyHours - previousWeeklyHours),
      weeklyProgress: Math.round((activeDaysThisWeek / 7) * 100),
      streak: calculateProgressStreak(input.progress),
      estimatedDuration: recommendation.recommendedLearning[0]?.suggestedEffort ?? durationFor(recommendation.highestPriority.priority),
      expectedImpact: impactFor(recommendation.highestPriority.priority),
      featuredOpportunity: selectFeaturedOpportunity(input.opportunities, input.progress, input.timelineEntries),
      latestActivity: [...input.activities].sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0] ?? null,
    };
  }, [input]);
}

function calculateConfidence(input: DashboardIntelligenceInput): number {
  const sources = [
    input.opportunities.length > 0,
    input.progress.length > 0,
    input.timelineEntries.length > 0,
    input.certificates.length > 0 || input.notes.length > 0,
  ];
  return Math.round((sources.filter(Boolean).length / sources.length) * 100);
}

function countActiveDays(progress: DailyProgress[], startDaysAgo: number, endDaysAgo: number): number {
  const today = startOfToday();
  const end = new Date(today);
  end.setDate(today.getDate() - startDaysAgo);
  const start = new Date(today);
  start.setDate(today.getDate() - endDaysAgo);

  return progress.filter((entry) => {
    const date = parseDate(entry.date);
    return date >= start && date < end && isActiveProgress(entry);
  }).length;
}

function sumCodingHours(progress: DailyProgress[], startDaysAgo: number, endDaysAgo: number): number {
  const today = startOfToday();
  const end = new Date(today);
  end.setDate(today.getDate() - startDaysAgo);
  const start = new Date(today);
  start.setDate(today.getDate() - endDaysAgo);

  return progress.reduce((total, entry) => {
    const date = parseDate(entry.date);
    return date >= start && date < end ? total + entry.codingHours + entry.projectsHours : total;
  }, 0);
}

function calculateProgressStreak(progress: DailyProgress[]): number {
  const activeDates = new Set(progress.filter(isActiveProgress).map((entry) => entry.date));
  let cursor = startOfToday();
  let streak = 0;

  if (!activeDates.has(toDateKey(cursor))) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  while (activeDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function selectFeaturedOpportunity(
  opportunities: Opportunity[],
  progress: DailyProgress[],
  timelineEntries: TimelineEntry[],
): FeaturedOpportunity | null {
  const opportunity = opportunities
    .filter((item) => !['Completed', 'Selected', 'Rejected'].includes(item.status))
    .sort((left, right) => priorityWeight(right.priority) - priorityWeight(left.priority)
      || deadlineValue(left.deadline) - deadlineValue(right.deadline)
      || left.title.localeCompare(right.title))[0];

  if (!opportunity) return null;

  const requiredSkills = opportunity.skills ?? [];
  const matchScore = calculateMatchScore(requiredSkills, progress, timelineEntries);
  const daysUntilDeadline = calculateDaysUntil(opportunity.deadline);
  const reasonParts = [
    `${opportunity.priority} priority`,
    opportunity.status === 'Saved' || opportunity.status === 'Planned' ? 'ready to advance' : `currently ${opportunity.status.toLowerCase()}`,
  ];
  if (daysUntilDeadline !== null) reasonParts.push(`${daysUntilDeadline} days until deadline`);

  return { opportunity, reason: reasonParts.join(' · '), matchScore, requiredSkills, daysUntilDeadline };
}

function calculateMatchScore(requiredSkills: string[], progress: DailyProgress[], timelineEntries: TimelineEntry[]): number | null {
  if (requiredSkills.length === 0) return null;

  const evidence = [
    ...timelineEntries.flatMap((entry) => [entry.learned, entry.built, entry.codingPractice]),
    progress.some((entry) => entry.dsaQuestions > 0) ? 'dsa algorithms data structures' : '',
    progress.some((entry) => entry.webDevHours > 0) ? 'web frontend react javascript typescript' : '',
    progress.some((entry) => entry.pythonHours > 0) ? 'python' : '',
  ].join(' ').toLowerCase();
  const matched = requiredSkills.filter((skill) => evidence.includes(skill.toLowerCase())).length;

  return Math.round((matched / requiredSkills.length) * 100);
}

function durationFor(priority: RecommendationPriority): string {
  return priority === 'critical' ? '60 min' : priority === 'high' ? '45 min' : '30 min';
}

function impactFor(priority: RecommendationPriority): string {
  return priority === 'critical' || priority === 'high' ? 'High impact' : 'Meaningful impact';
}

function priorityWeight(priority: Opportunity['priority']): number {
  return priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1;
}

function deadlineValue(deadline: string): number {
  const value = parseDate(deadline).getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function calculateDaysUntil(date: string): number | null {
  const target = parseDate(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.max(0, Math.ceil((target.getTime() - startOfToday().getTime()) / 86_400_000));
}

function isActiveProgress(entry: DailyProgress): boolean {
  return entry.codingHours > 0 || entry.dsaQuestions > 0 || entry.projectsHours > 0 || entry.readingMinutes > 0;
}

function startOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
