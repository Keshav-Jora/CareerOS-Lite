import type { EngineOutput, Recommendation } from '../../types/core.types';

const priorityRank: Record<Recommendation['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Produces presentation-ready recommendations without changing engine output.
 */
export class RecommendationGenerator {
  generate(engineOutput: EngineOutput): Recommendation[] {
    return engineOutput.recommendations
      .map((recommendation) => this.normalize(recommendation))
      .sort((left, right) => this.compare(left, right));
  }

  private normalize(recommendation: Recommendation): Recommendation {
    return {
      ...recommendation,
      relatedEntityIds: recommendation.relatedEntityIds
        ? [...recommendation.relatedEntityIds].sort()
        : undefined,
    };
  }

  private compare(left: Recommendation, right: Recommendation): number {
    const priorityDifference = priorityRank[right.priority] - priorityRank[left.priority];
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const confidenceDifference = right.confidence - left.confidence;
    if (confidenceDifference !== 0) {
      return confidenceDifference;
    }

    const createdAtDifference = right.createdAt.localeCompare(left.createdAt);
    return createdAtDifference !== 0 ? createdAtDifference : left.id.localeCompare(right.id);
  }
}
