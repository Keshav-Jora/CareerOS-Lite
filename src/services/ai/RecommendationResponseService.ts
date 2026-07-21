import { RecommendationGenerator } from '../../core/recommendation/RecommendationGenerator';
import { dataService } from '../dataService';
import type { EngineOutput, ExplainabilityTrace, Recommendation } from '../../types/core.types';

/** Returns Nova's primary deterministic recommendation without involving a provider. */
export class RecommendationResponseService {
  respond(message: string): string | null {
    if (!/\bwhat should i do(?: today)?\b|\bwhat(?:'s| is) my next(?: best)? action\b/i.test(message.trim())) return null;

    const recommendation = new RecommendationGenerator().generate(this.buildDecisionOutput())[0];
    return `## Primary recommendation\n\n### ${recommendation.title}\n\n${recommendation.description}\n\n**Why now:** ${recommendation.reasoning}`;
  }

  private buildDecisionOutput(): EngineOutput {
    const snapshot = dataService.repository.getSnapshot();
    const today = new Date().toISOString().slice(0, 10);
    const mission = snapshot.missions.find((item) => item.date === today && item.status !== 'completed' && (item.tasks?.some((task) => !task.completed) ?? true));
    const opportunity = snapshot.opportunities
      .filter((item) => item.deadline >= today && !['Completed', 'Rejected'].includes(item.status))
      .sort((left, right) => left.deadline.localeCompare(right.deadline))[0];
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    const goal = snapshot.goals
      .filter((item) => item.status === 'active')
      .sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || left.updatedAt.localeCompare(right.updatedAt))[0];

    const primary: Omit<Recommendation, 'createdAt' | 'explainabilityTraceId'> = mission
      ? {
        id: `recommendation-mission-${mission.id}`,
        title: `Complete ${mission.title}`,
        description: `Finish the ${mission.tasks?.filter((task) => !task.completed).length ?? 0} remaining task${mission.tasks?.filter((task) => !task.completed).length === 1 ? '' : 's'} in today's mission.`,
        confidence: 0.94,
        reasoning: "Today's mission is still incomplete, so completing it is the clearest commitment you can make today.",
        category: 'general', priority: 'high', status: 'active', relatedEntityIds: [mission.id],
      }
      : opportunity
        ? {
          id: `recommendation-deadline-${opportunity.id}`,
          title: `Complete ${opportunity.title} deadline`,
          description: 'Review the application requirements and submit before the deadline.',
          confidence: 0.94,
          reasoning: 'This is the nearest active deadline in your career pipeline.',
          category: 'deadline', priority: 'high', status: 'active', relatedEntityIds: [opportunity.id],
        }
        : goal
          ? {
            id: `recommendation-goal-${goal.id}`,
            title: goal.title,
            description: 'Make visible progress on this career goal today.',
            confidence: 0.82,
            reasoning: 'This is your highest-priority active career goal.',
            category: 'goal', priority: goal.priority, status: 'active', relatedEntityIds: [goal.id],
          }
          : {
            id: 'recommendation-build-pipeline',
            title: 'Build your opportunity pipeline',
            description: 'Capture one opportunity to give CareerOS a clear next step to optimize.',
            confidence: 0.72,
            reasoning: 'No active opportunities, goals, or incomplete missions are currently available.',
            category: 'application', priority: 'high', status: 'active',
          };
    const createdAt = new Date().toISOString();
    const trace: ExplainabilityTrace = {
      id: `trace-${primary.id}`, recommendationId: primary.id, summary: primary.reasoning,
      contributingFactors: [], dataSources: [{ source: 'CareerModel', retrievedAt: createdAt }], generatedAt: createdAt,
    };
    return { recommendations: [{ ...primary, createdAt, explainabilityTraceId: trace.id }], explainabilityTraces: [trace], generatedAt: createdAt };
  }
}
