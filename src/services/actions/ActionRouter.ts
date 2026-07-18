import { dataService } from '../dataService';
import type { Certificate, DailyProgress, Note, Opportunity, Task } from '../../types';
import { detectNovaAction } from './ActionRegistry';
import type { NovaActionIntent, NovaActionResult } from './ActionTypes';

const TASKS_KEY = 'career_os_dashboard_tasks';
const FOCUS_KEY = 'career_os_today_focus';

/** Executes only validated local actions through the existing data service. */
export class ActionRouter {
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
        case 'set_mission_focus': localStorage.setItem(FOCUS_KEY, intent.entity); return success(`✓ Today’s focus is now **${intent.entity}**.`);
        case 'complete_mission': localStorage.setItem(`${FOCUS_KEY}:status`, 'completed'); return success('✓ Today’s mission was marked complete. Great work building momentum.');
        case 'skip_mission': localStorage.setItem(`${FOCUS_KEY}:status`, 'skipped'); return success('Today’s mission was skipped. Nova will use your latest data for the next recommendation.');
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
    const tasks = JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]') as Task[];
    const existing = tasks.find((task) => task.text.toLowerCase() === name.toLowerCase());
    if (complete && !existing) return { status: 'failed', message: `I could not find a goal named **${name}**.`, };
    if (existing) existing.completed = complete;
    else tasks.push({ id: `goal-nova-${Date.now()}`, text: name, completed: false, dueDate: '' });
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return success(`✓ Goal **${name}** was ${complete ? 'completed' : 'created'}.`);
  }

  private updateDsa(progress: DailyProgress[], intent: NovaActionIntent): NovaActionResult {
    const dsaQuestions = Number(intent.parameters.value ?? intent.entity.match(/\d+/)?.[0] ?? 0);
    if (!Number.isFinite(dsaQuestions) || dsaQuestions < 0) return { status: 'failed', message: 'Please provide a valid non-negative DSA question count.', intent };
    const date = new Date().toISOString().slice(0, 10); const current = progress.find((item) => item.date === date);
    dataService.updateDailyProgress({ date, dsaQuestions, codingHours: current?.codingHours ?? 0, webDevHours: current?.webDevHours ?? 0, pythonHours: current?.pythonHours ?? 0, applicationsCount: current?.applicationsCount ?? 0, readingMinutes: current?.readingMinutes ?? 0, projectsHours: current?.projectsHours ?? 0 });
    return success(`✓ Today’s DSA progress is now **${dsaQuestions} questions**.`);
  }
}

function success(message: string): NovaActionResult { window.dispatchEvent(new Event('career-os-data-changed')); return { status: 'executed', message }; }
function failure(message: string, intent?: NovaActionIntent): NovaActionResult { return { status: 'failed', message, intent }; }
function describe(intent: NovaActionIntent): string { return `${intent.type.replaceAll('_', ' ')} ${intent.entity}`; }
