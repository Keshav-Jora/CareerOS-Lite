import type {
  Application,
  CareerModel,
  Deadline,
  Goal,
  Project,
  Skill,
} from '../../types/core.types';

/**
 * Converts a career model into a deterministic, structured text context.
 */
export class PromptBuilder {
  build(careerModel: CareerModel): string {
    const profile = [
      this.line('Career model ID', careerModel.id),
      this.line('User ID', careerModel.userId),
      this.line('Display name', careerModel.displayName),
      this.line('Headline', careerModel.headline),
      this.line('Last updated', careerModel.updatedAt),
    ].filter(this.isDefined);

    return [
      '# CareerOS Career Context',
      this.section('Profile', profile),
      this.section('Goals', this.sorted(careerModel.goals).map((goal) => this.formatGoal(goal))),
      this.section('Skills', this.sorted(careerModel.skills).map((skill) => this.formatSkill(skill))),
      this.section('Projects', this.sorted(careerModel.projects).map((project) => this.formatProject(project))),
      this.section('Applications', this.sorted(careerModel.applications).map((application) => this.formatApplication(application))),
      this.section('Deadlines', this.sorted(careerModel.deadlines).map((deadline) => this.formatDeadline(deadline))),
      this.section('Preferences', ['- No preference data available.']),
      this.section('History', ['- No history data available.']),
    ].join('\n\n');
  }

  private formatGoal(goal: Goal): string {
    return this.item(goal.id, goal.title, [
      this.line('Status', goal.status),
      this.line('Priority', goal.priority),
      this.line('Description', goal.description),
      this.line('Target date', goal.targetDate),
      this.line('Related skills', this.joinValues(goal.relatedSkillIds)),
      this.line('Related projects', this.joinValues(goal.relatedProjectIds)),
    ]);
  }

  private formatSkill(skill: Skill): string {
    return this.item(skill.id, skill.name, [
      this.line('Category', skill.category),
      this.line('Proficiency', skill.proficiency),
      this.line('Evidence URLs', this.joinValues(skill.evidenceUrls)),
      this.line('Related projects', this.joinValues(skill.relatedProjectIds)),
      this.line('Last practiced', skill.lastPracticedAt),
    ]);
  }

  private formatProject(project: Project): string {
    return this.item(project.id, project.name, [
      this.line('Status', project.status),
      this.line('Description', project.description),
      this.line('Skills', this.joinValues(project.skillIds)),
      this.line('Repository URL', project.repositoryUrl),
      this.line('Deployed URL', project.deployedUrl),
      this.line('Started', project.startedAt),
      this.line('Completed', project.completedAt),
    ]);
  }

  private formatApplication(application: Application): string {
    return this.item(application.id, `${application.title} — ${application.organization}`, [
      this.line('Status', application.status),
      this.line('Source', application.source),
      this.line('Application URL', application.applicationUrl),
      this.line('Submitted', application.submittedAt),
      this.line('Deadline ID', application.deadlineId),
      this.line('Last updated', application.updatedAt),
    ]);
  }

  private formatDeadline(deadline: Deadline): string {
    return this.item(deadline.id, deadline.title, [
      this.line('Due at', deadline.dueAt),
      this.line('Status', deadline.status),
      this.line('Timezone', deadline.timezone),
      this.line('Related entity', this.relatedEntity(deadline)),
      this.line('Reminder offsets (minutes)', this.joinNumbers(deadline.reminderOffsetsMinutes)),
    ]);
  }

  private section(title: string, entries: string[]): string {
    return `## ${title}\n${entries.length > 0 ? entries.join('\n') : '- None recorded.'}`;
  }

  private item(id: string, title: string, details: Array<string | undefined>): string {
    const formattedDetails = details.filter(this.isDefined);
    return [`- ${title} (ID: ${id})`, ...formattedDetails.map((detail) => `  - ${detail}`)].join('\n');
  }

  private line(label: string, value: string | undefined): string | undefined {
    return value && value.trim().length > 0 ? `${label}: ${value}` : undefined;
  }

  private joinValues(values: string[] | undefined): string | undefined {
    const definedValues = values?.filter((value) => value.trim().length > 0).sort() ?? [];
    return definedValues.length > 0 ? definedValues.join(', ') : undefined;
  }

  private joinNumbers(values: number[] | undefined): string | undefined {
    return values && values.length > 0 ? [...values].sort((left, right) => left - right).join(', ') : undefined;
  }

  private relatedEntity(deadline: Deadline): string | undefined {
    return deadline.relatedEntityType && deadline.relatedEntityId
      ? `${deadline.relatedEntityType}: ${deadline.relatedEntityId}`
      : undefined;
  }

  private sorted<T extends { id: string }>(items: T[]): T[] {
    return [...(items ?? [])].sort((left, right) => left.id.localeCompare(right.id));
  }

  private isDefined(value: string | undefined): value is string {
    return value !== undefined;
  }
}
