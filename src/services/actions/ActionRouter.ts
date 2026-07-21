import { dataService } from '../dataService';
import type { Certificate, DailyProgress, Note, Opportunity } from '../../types';
import { detectNovaAction } from './ActionRegistry';
import type { NovaActionIntent, NovaActionResult } from './ActionTypes';
import type { ActionPlan, ActionOperation } from '../ai/understanding/ActionPlanBuilder';
import type { CanonicalEntity } from '../data/CanonicalCareerRepository';
import { EntityPayloadAdapter } from '../data/EntityPayloadAdapter';

export interface ActionPlanExecutionResult {
  success: boolean;
  entity: CanonicalEntity | null;
  operation: ActionOperation;
  message: string;
  reason?: 'validation-failed' | 'confirmation-required' | 'unsupported-operation' | 'target-not-found';
  data?: unknown;
  issues?: ActionPlan['validation']['issues'];
}


/** Executes only validated local actions through the existing data service. */
export class ActionRouter {
  private readonly payloadAdapter = new EntityPayloadAdapter();
  routePlan(plan: ActionPlan): ActionPlanExecutionResult {
    if (plan.entity === 'opportunity') logOpportunityDebug('ActionRouter', 'src/services/actions/ActionRouter.ts', 'routePlan', plan, undefined);
    if (!plan.validation.valid) return { success: false, entity: plan.entity, operation: plan.operation, message: 'Action plan validation failed.', reason: 'validation-failed', issues: plan.validation.issues };
    if (!plan.entity) return { success: false, entity: null, operation: plan.operation, message: 'No supported entity was detected.', reason: 'unsupported-operation' };
    const repository = dataService.repository; const entity = plan.entity as CanonicalEntity;
    if (plan.requiresConfirmation) {
      const targetId = plan.operation === 'delete' ? this.targetId(plan, entity) : undefined;
      if (plan.operation === 'delete' && !targetId) return this.targetMissing(entity, plan.operation);
      return { success: false, entity, operation: plan.operation, message: 'Confirmation is required before this action can run.', reason: 'confirmation-required', data: targetId ? { id: targetId } : undefined };
    }
    const payload = plan.operation === 'create'
      ? this.payloadAdapter.normalize(entity, plan.payload)
      : this.updatePayload(plan.payload);
    if (plan.operation === 'create') {
      const duplicate = this.findDuplicate(entity, payload);
      if (duplicate) {
        return {
          success: false,
          entity,
          operation: plan.operation,
          message: entity === 'opportunity'
            ? 'Opportunity already exists. You can update it instead.'
            : 'That career milestone already exists. I did not create a duplicate.',
          reason: 'unsupported-operation',
          data: duplicate,
        };
      }
      const data = repository.create(entity, payload as never);
      const result = repository.get(entity, data.id) ? this.planSuccess(entity, plan.operation, this.createdMessage(entity, data), data) : { success: false, entity, operation: plan.operation, message: 'CareerOS could not verify that item was saved.' };
      if (entity === 'opportunity') logOpportunityDebug('ActionRouter', 'src/services/actions/ActionRouter.ts', 'routePlan', plan, result);
      return result;
    }
    if (plan.operation === 'update') { const id = this.targetId(plan, entity); if (!id) return this.targetMissing(entity, plan.operation); const current = repository.get<Record<string, unknown> & { id: string }>(entity, id); const data = repository.update(entity, id, payload as never); return data && repository.get(entity, id) ? this.planSuccess(entity, plan.operation, this.updatedMessage(entity, current ?? {}, data), data) : this.targetMissing(entity, plan.operation); }
    if (plan.operation === 'delete') { const id = this.targetId(plan, entity); if (!id) return this.targetMissing(entity, plan.operation); const current = repository.get<Record<string, unknown> & { id: string }>(entity, id); return repository.delete(entity, id) ? this.planSuccess(entity, plan.operation, this.deletedMessage(entity, current ?? {}, repository.getAll(entity).length)) : this.targetMissing(entity, plan.operation); }
    if (plan.operation === 'archive' || plan.operation === 'restore' || plan.operation === 'complete') { const id = this.targetId(plan, entity); if (!id) return this.targetMissing(entity, plan.operation); const status = plan.operation === 'archive' ? 'archived' : plan.operation === 'restore' ? 'active' : 'completed'; const data = repository.update(entity, id, { status } as never); return data ? this.planSuccess(entity, plan.operation, `${plan.operation} successfully.`, data) : this.targetMissing(entity, plan.operation); }
    const query = typeof plan.payload.query === 'string' ? plan.payload.query : plan.sourceMessage;
    const data = plan.intent === 'search' ? repository.search(entity, query) : repository.getAll(entity);
    return this.planSuccess(entity, plan.operation, 'Results retrieved successfully.', data);
  }

  route(message: string, confirmed = false): NovaActionResult {
    const intent = detectNovaAction(message);
    if (intent.type === 'unknown' || intent.confidence < 0.7) return { status: 'not-handled', message: '', intent };
    if (intent.requiresConfirmation && !confirmed) return { status: 'confirmation-required', message: `I can ${describe(intent)}. This changes existing data. Reply **confirm** to continue or **cancel** to stop.`, intent };

    const data = dataService.fetchAllData();
    try {
      switch (intent.type) {
        case 'add_opportunity': {
          const opportunity: Opportunity = { id: `opp-nova-${Date.now()}`, title: intent.entity, organization: 'Not set', category: 'Internship', source: 'Nova', applicationLink: '', applyDate: new Date().toISOString().slice(0, 10), deadline: '', status: 'Saved', priority: 'Medium', notes: 'Added by Nova.' };
          dataService.saveOpportunity(opportunity);
          if (!dataService.fetchAllData().opportunities.some((item) => item.id === opportunity.id)) return failure('CareerOS could not verify the new opportunity was saved.', intent);
          return success(`✓ **${intent.entity}** was added to your opportunity pipeline.`);
        }
        case 'delete_opportunity': return this.changeOpportunity(data.opportunities, intent, (item) => dataService.deleteOpportunity(item.id), 'deleted');
        case 'archive_opportunity': return this.changeOpportunity(data.opportunities, intent, (item) => dataService.saveOpportunity({ ...item, status: 'Completed' }), 'archived');
        case 'change_opportunity_status': return { status: 'failed', message: 'Please name the opportunity and the target status, for example: “Set Acme internship to Applied.”', intent };
        case 'add_skill': return this.saveSkill(data.notes, intent.entity, false);
        case 'complete_learning': return this.completeLearning(data.certificates, intent.entity);
        case 'add_learning': return this.saveSkill(data.notes, intent.entity, true);
        case 'create_goal': return this.saveGoal(intent.entity, false);
        case 'complete_goal': return this.saveGoal(intent.entity, true);
        case 'update_dsa_progress': return this.updateDsa(data.progressData, intent);
        case 'set_mission_focus': return this.saveMission(intent.entity, 'open');
        case 'complete_mission': return this.saveMission('Today’s mission', 'completed');
        case 'skip_mission': return this.saveMission('Today’s mission', 'skipped');
        default: return { status: 'failed', message: 'That action is recognized but needs more detail before I can safely apply it.', intent };
      }
    } catch { return { status: 'failed', message: 'I could not complete that action. Your existing data was left unchanged.', intent }; }
  }

  private changeOpportunity(opportunities: Opportunity[], intent: NovaActionIntent, apply: (item: Opportunity) => void, verb: string): NovaActionResult {
    const query = intent.entity.toLowerCase().replace(/^this item$/, '');
    const match = opportunities.find((item) => !query || `${item.title} ${item.organization}`.toLowerCase().includes(query));
    if (!match) return { status: 'failed', message: 'I could not find that opportunity. Please include its name.', intent };
    apply(match);
    const persisted = dataService.fetchAllData().opportunities;
    const verified = verb === 'deleted' ? !persisted.some((item) => item.id === match.id) : persisted.some((item) => item.id === match.id && item.status === 'Completed');
    return verified ? success(`✓ **${match.title}** was ${verb}.`) : failure(`CareerOS could not verify that **${match.title}** was ${verb}.`, intent);
  }

  private saveSkill(notes: Note[], name: string, learning: boolean): NovaActionResult {
    if (notes.some((note) => note.title.toLowerCase() === name.toLowerCase())) return { status: 'failed', message: `**${name}** is already tracked. I did not overwrite it.`, };
    dataService.saveNote({ id: `note-nova-${Date.now()}`, title: name, content: learning ? 'Learning item added by Nova.' : 'Skill added by Nova.', tags: [learning ? 'learning' : 'skill'], updatedAt: new Date().toISOString(), isPinned: false });
    return success(`✓ **${name}** was added to your ${learning ? 'learning plan' : 'skills'}.`);
  }

  private completeLearning(certificates: Certificate[], name: string): NovaActionResult {
    if (certificates.some((certificate) => certificate.name.toLowerCase() === name.toLowerCase())) return { status: 'failed', message: `**${name}** is already recorded as completed.`, };
    dataService.saveCertificate({ id: `cert-nova-${Date.now()}`, name, platform: 'Not set', date: new Date().toISOString().slice(0, 10), category: 'Course', notes: 'Completed through Nova action.' });
    return success(`✓ **${name}** was marked complete and added to your certifications.`);
  }

  private saveGoal(name: string, complete: boolean): NovaActionResult {
    const goals = dataService.repository.getSnapshot().goals;
    const existing = goals.find((goal) => goal.title.toLowerCase() === name.toLowerCase());
    if (complete && !existing) return { status: 'failed', message: `I could not find a goal named **${name}**.`, };
    const updatedAt = new Date().toISOString();
    const next = existing
      ? goals.map((goal) => goal.id === existing.id ? { ...goal, status: complete ? 'completed' as const : goal.status, updatedAt } : goal)
      : [...goals, { id: `goal-nova-${Date.now()}`, title: name, status: 'active' as const, priority: 'medium' as const, updatedAt }];
    dataService.repository.saveGoals(next);
    if (!dataService.repository.getSnapshot().goals.some((goal) => goal.title === name && (complete ? goal.status === 'completed' : true))) return failure(`CareerOS could not verify goal **${name}**.`, );
    return success(`✓ Goal **${name}** was ${complete ? 'completed' : 'created'}.`);
  }

  private saveMission(title: string, status: 'open' | 'completed' | 'skipped'): NovaActionResult {
    const snapshot = dataService.repository.getSnapshot(); const date = new Date().toISOString().slice(0, 10); const current = snapshot.missions.find((mission) => mission.date === date);
    const missions = current ? snapshot.missions.map((mission) => mission.id === current.id ? { ...mission, title, status, updatedAt: new Date().toISOString() } : mission) : [...snapshot.missions, { id: `mission-nova-${Date.now()}`, title, status, date, updatedAt: new Date().toISOString() }];
    dataService.repository.saveMissions(missions);
    return dataService.repository.getSnapshot().missions.some((mission) => mission.date === date && mission.status === status) ? success(status === 'open' ? `✓ Today’s focus is now **${title}**.` : status === 'completed' ? '✓ Today’s mission was marked complete. Great work building momentum.' : 'Today’s mission was skipped. Nova will use your latest data for the next recommendation.') : failure('CareerOS could not verify today’s mission.');
  }

  private updateDsa(progress: DailyProgress[], intent: NovaActionIntent): NovaActionResult {
    const dsaQuestions = Number(intent.parameters.value ?? intent.entity.match(/\d+/)?.[0] ?? 0);
    if (!Number.isFinite(dsaQuestions) || dsaQuestions < 0) return { status: 'failed', message: 'Please provide a valid non-negative DSA question count.', intent };
    const date = new Date().toISOString().slice(0, 10); const current = progress.find((item) => item.date === date);
    dataService.updateDailyProgress({ date, dsaQuestions, codingHours: current?.codingHours ?? 0, webDevHours: current?.webDevHours ?? 0, pythonHours: current?.pythonHours ?? 0, applicationsCount: current?.applicationsCount ?? 0, readingMinutes: current?.readingMinutes ?? 0, projectsHours: current?.projectsHours ?? 0 });
    return success(`✓ Today’s DSA progress is now **${dsaQuestions} questions**.`);
  }

  private targetId(plan: ActionPlan, entity: CanonicalEntity): string | undefined {
    if (typeof plan.payload.id === 'string') return plan.payload.id;
    const title = typeof plan.payload.title === 'string' ? plan.payload.title.trim().toLowerCase() : '';
    if (!title) return undefined;
    const matches = dataService.repository.getAll<Record<string, unknown> & { id: string }>(entity).filter((item) => {
      const candidate = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : '';
      const normalized = candidate.trim().toLowerCase();
      return normalized === title || normalized.includes(title) || title.includes(normalized);
    });
    if (matches.length === 1) return matches[0].id;

    const organization = typeof plan.payload.organization === 'string'
      ? plan.payload.organization.trim().toLowerCase()
      : typeof plan.payload.company === 'string'
        ? plan.payload.company.trim().toLowerCase()
        : '';
    if (organization) {
      const organizationMatches = matches.filter((item) => {
        const candidate = typeof item.organization === 'string' ? item.organization.trim().toLowerCase() : '';
        return candidate === organization || candidate.includes(organization) || organization.includes(candidate);
      });
      if (organizationMatches.length === 1) return organizationMatches[0].id;
    }
    const sourceOrganizationMatches = matches.filter((item) => {
      const candidate = typeof item.organization === 'string' ? item.organization.trim().toLowerCase() : '';
      return candidate.length > 0 && plan.sourceMessage.toLowerCase().includes(candidate);
    });
    if (sourceOrganizationMatches.length === 1) return sourceOrganizationMatches[0].id;
    return undefined;
  }
  private findDuplicate(entity: CanonicalEntity, payload: Record<string, unknown>): Record<string, unknown> | undefined {
    if (entity !== 'opportunity' && entity !== 'journey') return undefined;
    const title = typeof payload.title === 'string' ? payload.title.trim().toLowerCase() : '';
    if (!title) return undefined;

    return dataService.repository.getAll<Record<string, unknown> & { id: string }>(entity).find((item) => {
      const existingTitle = typeof item.title === 'string'
        ? item.title.trim().toLowerCase()
        : entity === 'journey'
          ? [item.achievements, item.built, item.learned, ...(Array.isArray(item.certificates) ? item.certificates : [])]
            .filter((value): value is string => typeof value === 'string')
            .join(' ')
            .toLowerCase()
          : '';
      if (entity === 'journey') return existingTitle.includes(title);

      const organization = typeof payload.organization === 'string' ? payload.organization.trim().toLowerCase() : '';
      const category = typeof payload.category === 'string' ? payload.category.trim().toLowerCase() : '';
      const existingOrganization = typeof item.organization === 'string' ? item.organization.trim().toLowerCase() : '';
      const existingCategory = typeof item.category === 'string' ? item.category.trim().toLowerCase() : '';
      return existingTitle === title && existingOrganization === organization && existingCategory === category;
    });
  }
  private updatePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
  }
  private createdMessage(entity: CanonicalEntity, data: Record<string, unknown>): string {
    const title = this.recordTitle(data, entity);
    if (entity === 'opportunity') return `**${title}** added.${data.deadline ? `\n\nDeadline: ${data.deadline}` : ''}${data.priority ? `\nPriority: ${data.priority}` : ''}`;
    if (entity === 'goal') return `Goal **${title}** added.`;
    if (entity === 'mission') return `Today's mission added with ${Array.isArray(data.tasks) ? data.tasks.length : 0} tasks.`;
    return `**${title}** added to your ${entity} records.`;
  }
  private updatedMessage(entity: CanonicalEntity, before: Record<string, unknown>, after: Record<string, unknown>): string {
    const changes = Object.keys(after).filter((key) => key !== 'id' && key !== 'updatedAt' && JSON.stringify(before[key]) !== JSON.stringify(after[key]));
    const details = changes.map((key) => `${key}: ${String(after[key])}`).join(', ');
    return `Updated **${this.recordTitle(after, entity)}**${details ? ` — ${details}.` : '.'}`;
  }
  private deletedMessage(entity: CanonicalEntity, data: Record<string, unknown>, remaining: number): string {
    const title = this.recordTitle(data, entity);
    return entity === 'opportunity' ? `Removed **${title}** successfully. Remaining opportunities: ${remaining}.` : `Removed **${title}** successfully.`;
  }
  private recordTitle(data: Record<string, unknown>, entity: CanonicalEntity): string {
    if (typeof data.title === 'string') return data.title;
    if (typeof data.name === 'string') return data.name;
    return entity === 'mission' ? "Today's Mission" : entity;
  }
  private targetMissing(entity: CanonicalEntity, operation: ActionOperation): ActionPlanExecutionResult { return { success: false, entity, operation, message: `I could not find that ${entity}. Please include its title${entity === 'opportunity' ? ' and company if there are duplicates' : ''}.`, reason: 'target-not-found' }; }
  private planSuccess(entity: CanonicalEntity, operation: ActionOperation, message: string, data?: unknown): ActionPlanExecutionResult { return { success: true, entity, operation, message, data }; }
}

function success(message: string): NovaActionResult { window.dispatchEvent(new Event('career-os-data-changed')); return { status: 'executed', message }; }
function failure(message: string, intent?: NovaActionIntent): NovaActionResult { return { status: 'failed', message, intent }; }
function describe(intent: NovaActionIntent): string { return `${intent.type.replaceAll('_', ' ')} ${intent.entity}`; }
