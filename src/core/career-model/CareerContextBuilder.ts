import { dataService, type AppDatabasePayload } from '../../services/dataService';
import type { Opportunity, Task, TimelineEntry } from '../../types';
import type {
  Application,
  CareerModel,
  Deadline,
  Goal,
  Project,
} from '../../types/core.types';

const DASHBOARD_TASKS_KEY = 'career_os_dashboard_tasks';

export interface CareerContextSource {
  fetchAllData(): AppDatabasePayload;
  getDashboardTasks(): Task[];
}

const defaultSource: CareerContextSource = {
  fetchAllData: () => dataService.fetchAllData(),
  getDashboardTasks: () => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const storedTasks = window.localStorage.getItem(DASHBOARD_TASKS_KEY);
      const parsedTasks: unknown = storedTasks ? JSON.parse(storedTasks) : [];
      return Array.isArray(parsedTasks) ? parsedTasks as Task[] : [];
    } catch {
      return [];
    }
  },
};

/**
 * Builds a normalized core career model from the application's current data.
 */
export class CareerContextBuilder {
  constructor(private readonly source: CareerContextSource = defaultSource) {}

  build(): CareerModel {
    const builtAt = new Date().toISOString();
    const data = this.readData();
    const tasks = this.readDashboardTasks();

    return {
      id: 'local-career-model',
      userId: 'local-user',
      displayName: data.userName || 'Student',
      headline: this.buildHeadline(data.userSchool, data.userGrad),
      goals: tasks.map((task) => this.toGoal(task, builtAt)),
      skills: [],
      projects: data.timelineEntries
        .filter((entry) => entry.built.trim().length > 0)
        .map((entry) => this.toProject(entry)),
      applications: data.opportunities.map((opportunity) => this.toApplication(opportunity, builtAt)),
      deadlines: data.opportunities.map((opportunity) => this.toDeadline(opportunity, builtAt)),
      updatedAt: builtAt,
    };
  }

  private readData(): AppDatabasePayload {
    try {
      const data = this.source.fetchAllData();
      return {
        opportunities: data.opportunities ?? [],
        timelineEntries: data.timelineEntries ?? [],
        progressData: data.progressData ?? [],
        certificates: data.certificates ?? [],
        notes: data.notes ?? [],
        notifications: data.notifications ?? [],
        activities: data.activities ?? [],
        userName: data.userName || 'Student',
        userSchool: data.userSchool || 'Not Set',
        userGrad: data.userGrad || 'Not Set',
      };
    } catch {
      return {
        opportunities: [],
        timelineEntries: [],
        progressData: [],
        certificates: [],
        notes: [],
        notifications: [],
        activities: [],
        userName: 'Student',
        userSchool: 'Not Set',
        userGrad: 'Not Set',
      };
    }
  }

  private readDashboardTasks(): Task[] {
    try {
      return this.source.getDashboardTasks() ?? [];
    } catch {
      return [];
    }
  }

  private buildHeadline(school: string, graduationYear: string): string | undefined {
    const profileDetails = [school, graduationYear].filter((value) => value && value !== 'Not Set');
    return profileDetails.length > 0 ? profileDetails.join(' · ') : undefined;
  }

  private toGoal(task: Task, timestamp: string): Goal {
    return {
      id: `goal-${task.id}`,
      title: task.text || 'Untitled task',
      status: task.completed ? 'completed' : 'not-started',
      priority: 'medium',
      targetDate: task.dueDate || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private toProject(entry: TimelineEntry): Project {
    return {
      id: `journey-project-${entry.id}`,
      name: `Journey build — ${entry.date}`,
      description: entry.built,
      status: 'completed',
      skillIds: [],
      completedAt: entry.date,
    };
  }

  private toApplication(opportunity: Opportunity, timestamp: string): Application {
    return {
      id: opportunity.id,
      title: opportunity.title || 'Untitled opportunity',
      organization: opportunity.organization || 'Unknown organization',
      status: this.normalizeApplicationStatus(opportunity.status),
      applicationUrl: opportunity.applicationLink || undefined,
      submittedAt: opportunity.applyDate || undefined,
      deadlineId: `deadline-${opportunity.id}`,
      source: opportunity.source || 'CareerOS',
      updatedAt: timestamp,
    };
  }

  private toDeadline(opportunity: Opportunity, fallbackTimestamp: string): Deadline {
    return {
      id: `deadline-${opportunity.id}`,
      title: `${opportunity.title || 'Opportunity'} deadline`,
      dueAt: this.toDeadlineTimestamp(opportunity.deadline, fallbackTimestamp),
      status: this.normalizeDeadlineStatus(opportunity.status),
      relatedEntityType: 'application',
      relatedEntityId: opportunity.id,
    };
  }

  private normalizeApplicationStatus(status: Opportunity['status']): Application['status'] {
    const statusMap: Record<Opportunity['status'], Application['status']> = {
      Saved: 'saved',
      Planned: 'draft',
      Applied: 'submitted',
      'Under Review': 'under-review',
      Shortlisted: 'interviewing',
      Interview: 'interviewing',
      Selected: 'offered',
      Rejected: 'rejected',
      Completed: 'withdrawn',
    };

    return statusMap[status];
  }

  private normalizeDeadlineStatus(status: Opportunity['status']): Deadline['status'] {
    if (status === 'Rejected') {
      return 'cancelled';
    }

    if (status === 'Selected' || status === 'Completed') {
      return 'completed';
    }

    return 'upcoming';
  }

  private toDeadlineTimestamp(date: string, fallbackTimestamp: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? `${date}T23:59:59.999Z`
      : fallbackTimestamp;
  }
}
