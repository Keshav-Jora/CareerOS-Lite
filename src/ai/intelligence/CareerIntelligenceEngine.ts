import { dataService } from '../../services/dataService';
import { calculateGamification } from '../../utils/gamification';
import {
  DSA_FOUNDATION_TARGET,
  getActiveOpportunityCount,
  getTotalDsaQuestions,
  hasProjectEvidence,
  hasRecordedActivity,
} from './rules';
import type {
  CareerIntelligenceDataSource,
  CareerIntelligenceInput,
  CareerRecommendation,
  CareerRisk,
  HighestPriority,
  LearningRecommendation,
  NextBestAction,
  ProjectRecommendation,
  SkillGap,
  TodayMission,
} from './types';

/**
 * Generates deterministic, rule-based career recommendations from the current
 * CareerOS dashboard data. It has no UI or AI-provider dependency.
 */
export class CareerIntelligenceEngine {
  constructor(private readonly dataSource: CareerIntelligenceDataSource = dataService) {}

  /** Reads the configured CareerOS data source and creates one recommendation. */
  generate(): CareerRecommendation {
    return this.generateFrom(this.dataSource.fetchAllData());
  }

  /** Creates a recommendation from an injected snapshot for tests or future backends. */
  generateFrom(input: CareerIntelligenceInput): CareerRecommendation {
    const gamification = calculateGamification(
      input.opportunities,
      input.timelineEntries,
      input.certificates,
      input.notes,
      input.progressData,
    );
    const activeOpportunityCount = getActiveOpportunityCount(input.opportunities);
    const totalDsaQuestions = getTotalDsaQuestions(input.progressData);
    const projectEvidenceExists = hasProjectEvidence(input.timelineEntries, input.progressData);
    const activityRecorded = hasRecordedActivity(input.progressData, input.timelineEntries);
    const highestPriority = this.resolveHighestPriority(
      activeOpportunityCount,
      totalDsaQuestions,
      projectEvidenceExists,
      activityRecorded,
      gamification.streak,
    );

    return {
      careerHealthScore: gamification.careerHealthScore,
      todayMission: this.toTodayMission(highestPriority),
      highestPriority,
      skillGaps: this.buildSkillGaps(activeOpportunityCount, totalDsaQuestions, projectEvidenceExists, gamification.streak),
      recommendedLearning: this.buildLearningRecommendations(totalDsaQuestions, gamification.streak),
      recommendedProjects: this.buildProjectRecommendations(projectEvidenceExists),
      risks: this.buildRisks(activeOpportunityCount, projectEvidenceExists, activityRecorded, gamification.streak),
      nextBestAction: this.toNextBestAction(highestPriority),
      generatedAt: new Date().toISOString(),
    };
  }

  private resolveHighestPriority(
    activeOpportunityCount: number,
    totalDsaQuestions: number,
    projectEvidenceExists: boolean,
    activityRecorded: boolean,
    streak: number,
  ): HighestPriority {
    if (activeOpportunityCount === 0) {
      return {
        title: 'Build an active opportunity pipeline',
        description: 'Identify and apply to one relevant internship, hackathon, or placement opportunity.',
        rationale: 'There are no applications currently moving through your pipeline.',
        priority: 'high',
      };
    }

    if (totalDsaQuestions < DSA_FOUNDATION_TARGET) {
      return {
        title: 'Strengthen DSA fundamentals',
        description: 'Complete a focused DSA practice session and review the underlying pattern.',
        rationale: `You have logged ${totalDsaQuestions} DSA questions; ${DSA_FOUNDATION_TARGET} builds a stronger foundation.`,
        priority: 'high',
      };
    }

    if (!projectEvidenceExists) {
      return {
        title: 'Create portfolio evidence',
        description: 'Define a small, shippable project that demonstrates one job-relevant skill.',
        rationale: 'No project work has been recorded in your CareerOS progress yet.',
        priority: 'high',
      };
    }

    if (activityRecorded && streak === 0) {
      return {
        title: 'Restore your learning rhythm',
        description: 'Log one focused learning or coding session today to restart momentum.',
        rationale: 'Your recent activity does not form an active learning streak.',
        priority: 'medium',
      };
    }

    return {
      title: 'Advance your strongest opportunity',
      description: 'Choose the next concrete action for an active application or project.',
      rationale: 'Your core career signals are active; consistent execution is the highest-value next step.',
      priority: 'medium',
    };
  }

  private toTodayMission(priority: HighestPriority): TodayMission {
    return {
      title: priority.title,
      description: priority.description,
      priority: priority.priority,
    };
  }

  private toNextBestAction(priority: HighestPriority): NextBestAction {
    return {
      title: priority.title,
      description: priority.description,
      priority: priority.priority,
    };
  }

  private buildSkillGaps(
    activeOpportunityCount: number,
    totalDsaQuestions: number,
    projectEvidenceExists: boolean,
    streak: number,
  ): SkillGap[] {
    const gaps: SkillGap[] = [];

    if (totalDsaQuestions < DSA_FOUNDATION_TARGET) {
      gaps.push({
        skill: 'Data structures and algorithms',
        severity: 'high',
        observation: `${totalDsaQuestions} questions logged; build toward a ${DSA_FOUNDATION_TARGET}-question foundation.`,
      });
    }
    if (!projectEvidenceExists) {
      gaps.push({
        skill: 'Portfolio project delivery',
        severity: 'high',
        observation: 'No project work has been recorded yet.',
      });
    }
    if (activeOpportunityCount === 0) {
      gaps.push({
        skill: 'Application execution',
        severity: 'high',
        observation: 'No active opportunities are currently being tracked.',
      });
    }
    if (streak === 0) {
      gaps.push({
        skill: 'Learning consistency',
        severity: 'medium',
        observation: 'There is no active learning streak.',
      });
    }

    return gaps;
  }

  private buildLearningRecommendations(totalDsaQuestions: number, streak: number): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];

    if (totalDsaQuestions < DSA_FOUNDATION_TARGET) {
      recommendations.push({
        title: 'Practice one DSA pattern',
        reason: 'A steady problem-solving foundation supports coding assessments and interviews.',
        suggestedEffort: '45 minutes',
      });
    }
    if (streak === 0) {
      recommendations.push({
        title: 'Schedule a daily learning block',
        reason: 'A small repeatable session is more sustainable than occasional long sessions.',
        suggestedEffort: '20 minutes daily',
      });
    }

    return recommendations;
  }

  private buildProjectRecommendations(projectEvidenceExists: boolean): ProjectRecommendation[] {
    if (projectEvidenceExists) return [];

    return [{
      title: 'Build one focused portfolio project',
      reason: 'A shippable project creates evidence of your skills for applications and interviews.',
    }];
  }

  private buildRisks(
    activeOpportunityCount: number,
    projectEvidenceExists: boolean,
    activityRecorded: boolean,
    streak: number,
  ): CareerRisk[] {
    const risks: CareerRisk[] = [];

    if (activeOpportunityCount === 0) {
      risks.push({
        title: 'Empty application pipeline',
        severity: 'high',
        description: 'Without an active opportunity, there is no near-term outcome to progress.',
      });
    }
    if (!projectEvidenceExists) {
      risks.push({
        title: 'Limited portfolio evidence',
        severity: 'medium',
        description: 'Applications may be less persuasive without a recorded project outcome.',
      });
    }
    if (activityRecorded && streak === 0) {
      risks.push({
        title: 'Interrupted learning momentum',
        severity: 'medium',
        description: 'A long gap between sessions can slow skill retention and progress.',
      });
    }

    return risks;
  }
}
