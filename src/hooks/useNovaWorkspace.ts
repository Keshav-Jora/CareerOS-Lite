import { useMemo } from 'react';
import type { Certificate, DailyProgress, Opportunity, TimelineEntry } from '../types';
import { useCommandCenter } from './useCommandCenter';
import { CareerStatisticsService } from '../services/data/CareerStatisticsService';

interface NovaWorkspaceData {
  opportunities: Opportunity[];
  progress: DailyProgress[];
  certificates: Certificate[];
  timeline: TimelineEntry[];
}

/**
 * Adapts the Command Center's core-backed recommendation state for Nova.
 */
export function useNovaWorkspace({ opportunities, progress, certificates, timeline }: NovaWorkspaceData) {
  const commandCenter = useCommandCenter({ opportunities, progress, certificates });

  return useMemo(() => {
    const statistics = new CareerStatisticsService().fromWorkspace({ opportunities, journey: timeline, certifications: certificates });
    const currentProgress = progress[progress.length - 1];
    const totalPracticeHours = progress.slice(-7).reduce((total, entry) => total + entry.codingHours, 0);

    return {
      ...commandCenter,
      careerSummary: {
        activeOpportunities: statistics.activeOpportunities,
        weeklyPracticeHours: totalPracticeHours,
        latestDsaQuestions: currentProgress?.dsaQuestions ?? 0,
        certificates: statistics.certifications,
      },
    };
  }, [certificates, commandCenter, opportunities, progress, timeline]);
}
