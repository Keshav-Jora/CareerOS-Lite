import type {
  Certificate,
  DailyProgress,
  Note,
  Opportunity,
  TimelineEntry,
} from '../../types';

/** Dashboard data required to generate a deterministic career recommendation. */
export interface CareerIntelligenceInput {
  opportunities: Opportunity[];
  timelineEntries: TimelineEntry[];
  progressData: DailyProgress[];
  certificates: Certificate[];
  notes: Note[];
  userName: string;
}

/** Boundary that allows the engine to use local data today and another source later. */
export interface CareerIntelligenceDataSource {
  fetchAllData(): CareerIntelligenceInput;
}

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TodayMission {
  title: string;
  description: string;
  priority: RecommendationPriority;
}

export interface HighestPriority extends TodayMission {
  rationale: string;
}

export interface SkillGap {
  skill: string;
  severity: RecommendationPriority;
  observation: string;
}

export interface LearningRecommendation {
  title: string;
  reason: string;
  suggestedEffort: string;
}

export interface ProjectRecommendation {
  title: string;
  reason: string;
}

export interface CareerRisk {
  title: string;
  severity: RecommendationPriority;
  description: string;
}

export interface NextBestAction {
  title: string;
  description: string;
  priority: RecommendationPriority;
}

/**
 * A stable, presentation-independent recommendation contract.
 * New fields can be added without changing the engine's input boundary.
 */
export interface CareerRecommendation {
  careerHealthScore: number;
  todayMission: TodayMission;
  highestPriority: HighestPriority;
  skillGaps: SkillGap[];
  recommendedLearning: LearningRecommendation[];
  recommendedProjects: ProjectRecommendation[];
  risks: CareerRisk[];
  nextBestAction: NextBestAction;
  generatedAt: string;
}
