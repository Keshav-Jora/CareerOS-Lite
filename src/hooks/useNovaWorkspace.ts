import { useMemo } from 'react';
import type { Certificate, DailyProgress, Opportunity } from '../types';
import { useCommandCenter } from './useCommandCenter';

interface NovaWorkspaceData {
  opportunities: Opportunity[];
  progress: DailyProgress[];
  certificates: Certificate[];
}

/**
 * Adapts the Command Center's core-backed recommendation state for Nova.
 */
export function useNovaWorkspace({ opportunities, progress, certificates }: NovaWorkspaceData) {
  const commandCenter = useCommandCenter({ opportunities, progress, certificates });

  return useMemo(() => {
    const activeOpportunities = opportunities.filter(
      (opportunity) => !['Completed', 'Selected', 'Rejected'].includes(opportunity.status),
    ).length;
    const currentProgress = progress[progress.length - 1];
    const totalPracticeHours = progress.slice(-7).reduce((total, entry) => total + entry.codingHours, 0);

    return {
      ...commandCenter,
      careerSummary: {
        activeOpportunities,
        weeklyPracticeHours: totalPracticeHours,
        latestDsaQuestions: currentProgress?.dsaQuestions ?? 0,
        certificates: certificates.length,
      },
    };
  }, [certificates.length, commandCenter, opportunities, progress]);
}
