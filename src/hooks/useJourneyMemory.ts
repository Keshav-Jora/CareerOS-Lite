import { useMemo } from 'react';
import { CareerContextBuilder } from '../core/career-model/CareerContextBuilder';
import { ExplainabilityEngine } from '../core/recommendation/ExplainabilityEngine';
import { RecommendationGenerator } from '../core/recommendation/RecommendationGenerator';
import type { EngineOutput, ExplainabilityTrace, Recommendation } from '../types/core.types';
import type { TimelineEntry } from '../types';

export interface JourneyMilestoneMemory {
  id: string;
  title: string;
  date: string;
  impact: string;
  reflection: string;
}

/**
 * Adapts timeline history into AI-ready memory summaries for the Journey UI.
 */
export function useJourneyMemory(timelineEntries: TimelineEntry[]) {
  return useMemo(() => {
    const careerModel = new CareerContextBuilder().build();
    const engineOutput = createFallbackOutput(careerModel.updatedAt, timelineEntries);
    const recommendations = new RecommendationGenerator().generate(engineOutput);
    const nextRecommendation = recommendations[0];
    const trace = engineOutput.explainabilityTraces.find((item) => item.recommendationId === nextRecommendation.id);
    const milestones = timelineEntries.map(toMilestoneMemory);
    const latestEntry = timelineEntries[0];
    const majorEntry = timelineEntries.find((entry) => entry.isMajorMilestone) ?? latestEntry;
    const buildEntry = timelineEntries.find((entry) => entry.built.trim().length > 0) ?? latestEntry;
    const learningEntry = timelineEntries.find((entry) => entry.learned.trim().length > 0) ?? latestEntry;
    const applications = timelineEntries.reduce((total, entry) => total + entry.applications.length, 0);
    const certifications = timelineEntries.reduce((total, entry) => total + entry.certificates.length, 0);
    const codingEntries = timelineEntries.filter((entry) => entry.codingPractice.trim().length > 0).length;

    return {
      lastUpdated: latestEntry?.date ?? careerModel.updatedAt,
      memoryStatus: 'AI memory is synchronized',
      milestones,
      growth: {
        projects: timelineEntries.filter((entry) => entry.built.trim().length > 0).length,
        skills: timelineEntries.filter((entry) => entry.learned.trim().length > 0).length,
        applications,
        certifications,
        codingProgress: codingEntries,
      },
      reflections: {
        biggestAchievement: majorEntry?.achievements || majorEntry?.built || 'Log a milestone to start building your career memory.',
        strongestImprovement: buildEntry?.built || 'Your next build will become a visible record of progress.',
        consistency: codingEntries > 0
          ? `${codingEntries} logged coding practice session${codingEntries === 1 ? '' : 's'} show steady investment in your technical growth.`
          : 'No coding practice has been logged yet. A short focused session is the easiest way to build consistency.',
        nextFocus: nextRecommendation.title,
      },
      insights: {
        highestImpactDecision: majorEntry?.achievements || majorEntry?.built || 'Capture your next high-impact decision.',
        bestProject: buildEntry?.built || 'Your next project milestone will appear here.',
        mostValuableLearning: learningEntry?.learned || 'Add a learning reflection to identify your strongest insight.',
        nextMilestone: nextRecommendation.title,
      },
      nextRecommendation,
      nextExplanation: new ExplainabilityEngine().explain(nextRecommendation, trace),
    };
  }, [timelineEntries]);
}

function toMilestoneMemory(entry: TimelineEntry): JourneyMilestoneMemory {
  const title = entry.achievements || entry.built || entry.learned || 'Career milestone';
  const impact = entry.isMajorMilestone
    ? 'Major milestone that adds meaningful proof to your career story.'
    : entry.built
      ? 'A tangible build strengthens the evidence behind your career direction.'
      : entry.learned
        ? 'This learning compounds into stronger future projects and interviews.'
        : 'This entry keeps your career record complete and reflective.';
  const reflection = entry.lessons
    ? entry.lessons
    : entry.failures
      ? 'A documented setback creates a concrete lesson for the next attempt.'
      : entry.codingPractice
        ? 'Consistent practice is turning technical effort into repeatable momentum.'
        : 'This milestone adds context to how your career is evolving over time.';

  return { id: entry.id, title, date: entry.date, impact, reflection };
}

function createFallbackOutput(generatedAt: string, timelineEntries: TimelineEntry[]): EngineOutput {
  const latestEntry = timelineEntries[0];
  const recommendation: Recommendation = {
    id: 'journey-next-milestone',
    title: latestEntry?.built
      ? 'Turn your latest build into visible career evidence'
      : 'Record one meaningful career milestone',
    description: latestEntry?.built
      ? 'Document the outcome, impact, and learning from your latest build so it strengthens your career story.'
      : 'Capture what you learned, built, or practiced to create a clearer record of your growth.',
    confidence: 0.82,
    reasoning: latestEntry?.built
      ? 'Your latest build is the strongest available signal to develop into a portfolio-quality milestone.'
      : 'A consistent memory of milestones gives CareerOS stronger evidence for future career guidance.',
    category: latestEntry?.built ? 'project' : 'goal',
    priority: 'high',
    status: 'active',
    createdAt: generatedAt,
    explainabilityTraceId: 'journey-next-milestone-trace',
  };
  const trace: ExplainabilityTrace = {
    id: 'journey-next-milestone-trace',
    recommendationId: recommendation.id,
    summary: recommendation.reasoning,
    contributingFactors: [{
      name: 'Career memory',
      impact: 'positive',
      detail: `${timelineEntries.length} milestone${timelineEntries.length === 1 ? '' : 's'} currently inform your career story.`,
    }],
    dataSources: [{ source: 'Journey timeline', retrievedAt: generatedAt }],
    generatedAt,
  };

  return { recommendations: [recommendation], explainabilityTraces: [trace], generatedAt };
}
