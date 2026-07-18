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
    if (!plan.validation.valid) return { success: false, entity: plan.entity, operation: plan.operation, message: 'Action plan validation failed.', reason: 'validation-failed', issues: plan.validation.issues };
    if (plan.requiresConfirmation) return { success: false, entity: plan.entity, operation: plan.operation, message: 'Confirmation is required before this action can run.', reason: 'confirmation-required' };
    if (!plan.entity) return { success: false, entity: null, operation: plan.operation, message: 'No supported entity was detected.', reason: 'unsupported-operation' };
    const repository = dataService.repository; const entity = plan.entity as CanonicalEntity;
    const payload = this.payloadAdapter.normalize(entity, plan.payload);
    if (plan.operation === 'create') { const data = repository.create(entity, payload as never); return repository.get(entity, data.id) ? this.planSuccess(entity, plan.operation, 'Created successfully.', data) : { success: false, entity, operation: plan.operation, message: 'Persistence verification failed.' }; }
    if (plan.operation === 'update') { const id = this.targetId(plan); if (!id) return this.targetMissing(entity, plan.operation); const data = repository.update(entity, id, payload as never); return data && repository.get(entity, id) ? this.planSuccess(entity, plan.operation, 'Updated successfully.', data) : this.targetMissing(entity, plan.operation); }
    if (plan.operation === 'delete') { const id = this.targetId(plan); if (!id) return this.targetMissing(entity, plan.operation); return repository.delete(entity, id) ? this.planSuccess(entity, plan.operation, 'Deleted successfully.') : this.targetMissing(entity, plan.operation); }
    if (plan.operation === 'archive' || plan.operation === 'restore' || plan.operation === 'complete') { const id = this.targetId(plan); if (!id) return this.targetMissing(entity, plan.operation); const status = plan.operation === 'archive' ? 'archived' : plan.operation === 'restore' ? 'active' : 'completed'; const data = repository.update(entity, id, { status } as never); return data ? this.planSuccess(entity, plan.operation, `${plan.operation} successfully.`, data) : this.targetMissing(entity, plan.operation); }
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

  private targetId(plan: ActionPlan): string | undefined { const id = plan.payload.id; return typeof id === 'string' ? id : undefined; }
  private targetMissing(entity: CanonicalEntity, operation: ActionOperation): ActionPlanExecutionResult { return { success: false, entity, operation, message: 'A valid target id is required.', reason: 'target-not-found' }; }
  private planSuccess(entity: CanonicalEntity, operation: ActionOperation, message: string, data?: unknown): ActionPlanExecutionResult { return { success: true, entity, operation, message, data }; }
}

function success(message: string): NovaActionResult { window.dispatchEvent(new Event('career-os-data-changed')); return { status: 'executed', message }; }
function failure(message: string, intent?: NovaActionIntent): NovaActionResult { return { status: 'failed', message, intent }; }
function describe(intent: NovaActionIntent): string { return `${intent.type.replaceAll('_', ' ')} ${intent.entity}`; }
