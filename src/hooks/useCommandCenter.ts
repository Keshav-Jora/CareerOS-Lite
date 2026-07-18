import { useMemo } from 'react';
import { CareerContextBuilder } from '../core/career-model/CareerContextBuilder';
import { ExplainabilityEngine } from '../core/recommendation/ExplainabilityEngine';
import { RecommendationGenerator } from '../core/recommendation/RecommendationGenerator';
import type { CareerModel, EngineOutput, ExplainabilityTrace, Recommendation } from '../types/core.types';
import type { Certificate, DailyProgress, Opportunity } from '../types';

type CommandDestination = 'opportunities' | 'progress' | 'journey' | 'notes' | 'certificates';

export interface CommandCenterAction {
  label: string;
  destination: CommandDestination;
}

export interface CommandCenterViewModel {
  analysisLabel: string;
  monitoredOpportunities: number;
  watchedDeadlines: number;
  recommendations: Recommendation[];
  topRecommendation: Recommendation;
  topExplanation: string;
  todayPlan: Recommendation[];
  actionForRecommendation: (recommendation: Recommendation) => CommandCenterAction;
}

interface CommandCenterData {
  opportunities: Opportunity[];
  progress: DailyProgress[];
  certificates: Certificate[];
}

const actionByCategory: Record<Recommendation['category'], CommandCenterAction> = {
  application: { label: 'Open opportunities', destination: 'opportunities' },
  deadline: { label: 'Review deadline', destination: 'opportunities' },
  goal: { label: 'Open journey', destination: 'journey' },
  project: { label: 'Open journey', destination: 'journey' },
  skill: { label: 'Log practice', destination: 'progress' },
  general: { label: 'Open notes', destination: 'notes' },
};

/**
 * UI adapter for the Command Center while a live AI provider is not connected.
 */
export function useCommandCenter({ opportunities, progress, certificates }: CommandCenterData): CommandCenterViewModel {
  return useMemo(() => {
    const careerModel = new CareerContextBuilder().build();
    const engineOutput = createDeterministicMockOutput(careerModel);
    const recommendations = new RecommendationGenerator().generate(engineOutput);
    const topRecommendation = recommendations[0];
    const topTrace = engineOutput.explainabilityTraces.find((trace) => trace.recommendationId === topRecommendation.id);

    return {
      analysisLabel: 'AI context is up to date',
      monitoredOpportunities: careerModel.applications.length,
      watchedDeadlines: careerModel.deadlines.filter((deadline) => deadline.status === 'upcoming').length,
      recommendations,
      topRecommendation,
      topExplanation: new ExplainabilityEngine().explain(topRecommendation, topTrace),
      todayPlan: recommendations.slice(0, 3),
      actionForRecommendation: (recommendation) => actionByCategory[recommendation.category],
    };
  }, [opportunities, progress, certificates]);
}

function createDeterministicMockOutput(careerModel: CareerModel): EngineOutput {
  const generatedAt = careerModel.updatedAt;
  const recommendations: Recommendation[] = [];
  const traces: ExplainabilityTrace[] = [];
  const addRecommendation = (
    recommendation: Omit<Recommendation, 'createdAt' | 'explainabilityTraceId'>,
    factorName: string,
    factorDetail: string,
  ) => {
    const traceId = `trace-${recommendation.id}`;
    recommendations.push({ ...recommendation, createdAt: generatedAt, explainabilityTraceId: traceId });
    traces.push({
      id: traceId,
      recommendationId: recommendation.id,
      summary: recommendation.reasoning,
      contributingFactors: [{ name: factorName, impact: 'positive', detail: factorDetail }],
      dataSources: [{ source: 'CareerModel', retrievedAt: generatedAt }],
      generatedAt,
    });
  };

  const nextDeadline = careerModel.deadlines
    .filter((deadline) => deadline.status === 'upcoming' && deadline.dueAt >= generatedAt)
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0];
  const pendingApplication = careerModel.applications
    .filter((application) => application.status === 'submitted' || application.status === 'under-review' || application.status === 'interviewing')
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  const activeGoal = careerModel.goals
    .filter((goal) => goal.status !== 'completed')
    .sort((left, right) => left.priority.localeCompare(right.priority) || left.id.localeCompare(right.id))[0];

  if (nextDeadline) {
    addRecommendation({
      id: `recommendation-${nextDeadline.id}`,
      title: `Complete ${nextDeadline.title}`,
      description: 'Review the application requirements and submit before the deadline.',
      confidence: 0.94,
      reasoning: 'This is the nearest active deadline in your career pipeline.',
      category: 'deadline',
      priority: 'high',
      status: 'active',
      relatedEntityIds: [nextDeadline.relatedEntityId ?? nextDeadline.id],
    }, 'Upcoming deadline', `Due ${nextDeadline.dueAt}.`);
  }

  if (pendingApplication) {
    addRecommendation({
      id: `recommendation-${pendingApplication.id}`,
      title: `Advance your ${pendingApplication.organization} application`,
      description: 'Review the application status and prepare the next strongest follow-up.',
      confidence: 0.86,
      reasoning: 'An active application is the clearest near-term opportunity to improve.',
      category: 'application',
      priority: 'high',
      status: 'active',
      relatedEntityIds: [pendingApplication.id],
    }, 'Active application', `${pendingApplication.title} is currently ${pendingApplication.status}.`);
  }

  if (activeGoal) {
    addRecommendation({
      id: `recommendation-${activeGoal.id}`,
      title: activeGoal.title,
      description: activeGoal.description ?? 'Make visible progress on this career goal today.',
      confidence: 0.78,
      reasoning: 'This active goal is a useful way to turn your current career plan into progress.',
      category: 'goal',
      priority: activeGoal.priority,
      status: 'active',
      relatedEntityIds: [activeGoal.id],
    }, 'Active goal', `Current status: ${activeGoal.status}.`);
  }

  if (recommendations.length === 0) {
    addRecommendation({
      id: 'recommendation-build-pipeline',
      title: 'Build your opportunity pipeline',
      description: 'Capture one opportunity to give CareerOS a clear next step to optimize.',
      confidence: 0.72,
      reasoning: 'A stronger opportunity pipeline creates more actionable career decisions.',
      category: 'application',
      priority: 'high',
      status: 'active',
    }, 'Opportunity pipeline', 'No active opportunities are currently available.');
  }

  return { recommendations, explainabilityTraces: traces, generatedAt };
}
