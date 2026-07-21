import type { CanonicalCareerData } from '../../types/career-data';
import type { TimelineEntry } from '../../types';

export interface CareerStatistics {
  milestones: number;
  projects: number;
  applications: number;
  certifications: number;
  activeGoals: number;
  missions: number;
  opportunities: number;
}

/** Calculates the product-wide career counts from canonical records. */
export class CareerStatisticsService {
  fromWorkspace(input: Pick<CanonicalCareerData, 'opportunities' | 'journey' | 'certifications'>): CareerStatistics & { activeOpportunities: number } {
    const journey = this.fromJourney(input.journey);
    const certifications = new Set([
      ...input.certifications.map((certificate) => certificate.name.trim().toLowerCase()),
      ...input.journey.flatMap((entry) => entry.certificates.map((certificate) => certificate.trim().toLowerCase())),
    ].filter(Boolean));
    return {
      ...journey,
      certifications: certifications.size,
      activeGoals: 0,
      missions: 0,
      opportunities: input.opportunities.length,
      activeOpportunities: input.opportunities.filter((opportunity) => !['Completed', 'Selected', 'Rejected'].includes(opportunity.status)).length,
    };
  }

  fromSnapshot(snapshot: CanonicalCareerData): CareerStatistics {
    const journey = this.fromJourney(snapshot.journey);
    const certifications = new Set([
      ...snapshot.certifications.map((certificate) => certificate.name.trim().toLowerCase()),
      ...snapshot.journey.flatMap((entry) => entry.certificates.map((certificate) => certificate.trim().toLowerCase())),
    ].filter(Boolean));

    return {
      ...journey,
      certifications: certifications.size,
      activeGoals: snapshot.goals.filter((goal) => goal.status === 'active').length,
      missions: snapshot.missions.filter((mission) => mission.date === new Date().toISOString().slice(0, 10)).length,
      opportunities: snapshot.opportunities.length,
    };
  }

  fromJourney(entries: TimelineEntry[]): Pick<CareerStatistics, 'milestones' | 'projects' | 'applications' | 'certifications'> {
    return {
      milestones: entries.length,
      projects: entries.filter((entry) => entry.built.trim().length > 0).length,
      applications: entries.reduce((total, entry) => total + entry.applications.length, 0),
      certifications: new Set(entries.flatMap((entry) => entry.certificates.map((certificate) => certificate.trim().toLowerCase())).filter(Boolean)).size,
    };
  }
}
