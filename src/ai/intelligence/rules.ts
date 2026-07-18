import type { DailyProgress, Opportunity, TimelineEntry } from '../../types';

export const ACTIVE_OPPORTUNITY_STATUSES = new Set<Opportunity['status']>([
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
]);

export const DSA_FOUNDATION_TARGET = 25;

export function getActiveOpportunityCount(opportunities: Opportunity[]): number {
  return opportunities.filter((opportunity) => ACTIVE_OPPORTUNITY_STATUSES.has(opportunity.status)).length;
}

export function getTotalDsaQuestions(progressData: DailyProgress[]): number {
  return progressData.reduce((total, entry) => total + Math.max(0, entry.dsaQuestions), 0);
}

export function hasProjectEvidence(timelineEntries: TimelineEntry[], progressData: DailyProgress[]): boolean {
  return timelineEntries.some((entry) => entry.built.trim().length > 0)
    || progressData.some((entry) => entry.projectsHours > 0);
}

export function hasRecordedActivity(progressData: DailyProgress[], timelineEntries: TimelineEntry[]): boolean {
  return progressData.some((entry) => (
    entry.codingHours > 0
    || entry.dsaQuestions > 0
    || entry.projectsHours > 0
    || entry.readingMinutes > 0
  )) || timelineEntries.length > 0;
}
