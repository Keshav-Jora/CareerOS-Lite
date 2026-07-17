import type { ExplainabilityTrace, Recommendation } from '../../types/core.types';

/**
 * Formats recommendation reasoning and trace data for human-readable display.
 */
export class ExplainabilityEngine {
  explain(recommendation: Recommendation, trace?: ExplainabilityTrace): string {
    const contributingFactors = trace?.contributingFactors ?? [];
    const tradeOffs = contributingFactors.filter((factor) => factor.impact === 'negative');
    const supportingFactors = contributingFactors.filter((factor) => factor.impact !== 'negative');

    return [
      `Why this recommendation: ${recommendation.reasoning}`,
      `Confidence: ${Math.round(recommendation.confidence * 100)}%`,
      trace?.summary ? `Explanation: ${trace.summary}` : 'Explanation: No additional explainability trace is available.',
      this.list('Contributing factors', supportingFactors.map((factor) => `${factor.name}: ${factor.detail}`)),
      tradeOffs.length > 0
        ? this.list('Trade-offs', tradeOffs.map((factor) => `${factor.name}: ${factor.detail}`))
        : undefined,
    ].filter(this.isDefined).join('\n');
  }

  private list(title: string, items: string[]): string {
    return items.length > 0
      ? `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`
      : `${title}: None available.`;
  }

  private isDefined(value: string | undefined): value is string {
    return value !== undefined;
  }
}
