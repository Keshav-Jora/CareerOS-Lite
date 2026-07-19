import { dataService } from '../dataService';
import { CareerStatisticsService } from '../data/CareerStatisticsService';
import type { CareerMission } from '../../types/career-data';

/** Answers deterministic CareerOS questions directly from the canonical repository. */
export class RepositoryResponseService {
  respond(message: string): string | null {
    const value = message.trim().toLowerCase();
    const snapshot = dataService.repository.getSnapshot();

    if (/^(hi|hello|hey|thanks|thank you|bye|good morning|good evening)[!. ]*$/i.test(value)) return this.smallTalk(value);
    if (/^(?:show|what(?:'s| is))\b.*\btoday'?s mission\b/i.test(value)) return this.mission(snapshot.missions);
    if (/\bwhat goals? am i working on\b|\bshow (?:my )?goals?\b/i.test(value)) return this.goals(snapshot.goals);
    if (/\bsummarize (?:everything|my career|career)\b/i.test(value)) return this.summary(snapshot);
    if (/\bclosest deadline\b|\bdeadline is closest\b/i.test(value)) return this.closestDeadline(snapshot.opportunities);
    if (/\bhow many opportunities\b|\bopportunity count\b/i.test(value)) return `You currently have **${snapshot.opportunities.length} ${snapshot.opportunities.length === 1 ? 'opportunity' : 'opportunities'}** tracked.`;
    if (/\bwhat certifications? do i have\b|\bshow (?:my )?certifications?\b/i.test(value)) return this.certifications(snapshot.certifications, snapshot.journey);
    return null;
  }

  fallback(): string {
    const snapshot = dataService.repository.getSnapshot();
    const available = snapshot.opportunities.length + snapshot.goals.length + snapshot.missions.length + snapshot.certifications.length + snapshot.journey.length;
    if (!available) return "I'm having trouble generating additional insights right now, but your CareerOS data is still available.";
    return `I'm having trouble generating additional insights right now, but your CareerOS data is still available. You currently have ${snapshot.opportunities.length} opportunities, ${snapshot.goals.length} goals, and ${snapshot.journey.length} journey milestones tracked.`;
  }

  private smallTalk(value: string): string {
    if (/thanks|thank you/.test(value)) return "You're welcome — I'm here whenever you want to review your career plan.";
    if (/bye/.test(value)) return 'See you soon. Keep building momentum.';
    if (/good morning/.test(value)) return 'Good morning! What would you like to make progress on today?';
    if (/good evening/.test(value)) return 'Good evening! Want to review today’s progress or plan tomorrow?';
    return 'Hi! I can help you manage opportunities, goals, missions, and career progress.';
  }

  private mission(missions: CareerMission[]): string {
    const today = new Date().toISOString().slice(0, 10);
    const mission = missions.find((item) => item.date === today);
    if (!mission) return "You don't have a mission saved for today yet.";
    const completed = mission.tasks?.filter((task) => task.completed).length ?? 0;
    const tasks = mission.tasks?.map((task) => `- ${task.completed ? '✓' : '○'} ${task.label}`).join('\n');
    return `## ${mission.title}\n\n${completed}/${mission.tasks?.length ?? 0} tasks complete · ${mission.duration ?? '45 min'} · ${mission.priority ?? 'High'} priority${tasks ? `\n\n${tasks}` : ''}`;
  }

  private goals(goals: { title: string; status: string; priority: string }[]): string {
    const active = goals.filter((goal) => goal.status === 'active');
    if (!active.length) return "You don't have any active goals recorded right now.";
    return `## Active goals\n\n${active.map((goal) => `- ${goal.title} (${goal.priority} priority)`).join('\n')}`;
  }

  private summary(snapshot: ReturnType<typeof dataService.repository.getSnapshot>): string {
    const statistics = new CareerStatisticsService().fromSnapshot(snapshot);
    return `## CareerOS summary\n\n- Opportunities: ${statistics.opportunities}\n- Active goals: ${statistics.activeGoals}\n- Today's missions: ${statistics.missions}\n- Certifications: ${statistics.certifications}\n- Journey milestones: ${statistics.milestones}`;
  }

  private closestDeadline(opportunities: ReturnType<typeof dataService.repository.getSnapshot>['opportunities']): string {
    const today = new Date().toISOString().slice(0, 10);
    const closest = opportunities
      .filter((opportunity) => opportunity.deadline && opportunity.deadline >= today)
      .sort((left, right) => left.deadline.localeCompare(right.deadline))[0];
    return closest ? `Your closest deadline is **${closest.title}** on **${closest.deadline}**.` : 'You have no upcoming opportunity deadlines recorded.';
  }

  private certifications(certifications: ReturnType<typeof dataService.repository.getSnapshot>['certifications'], journey: ReturnType<typeof dataService.repository.getSnapshot>['journey']): string {
    const names = [...new Set([...certifications.map((certificate) => certificate.name), ...journey.flatMap((entry) => entry.certificates)])];
    return names.length ? `## Certifications\n\n${names.map((name) => `- ${name}`).join('\n')}` : "You don't have any certifications recorded yet.";
  }
}
