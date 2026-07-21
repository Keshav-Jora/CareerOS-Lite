export type CareerOSIntent =
  | 'ADD_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL' | 'SHOW_GOALS'
  | 'ADD_OPPORTUNITY' | 'UPDATE_OPPORTUNITY' | 'DELETE_OPPORTUNITY' | 'SHOW_OPPORTUNITIES'
  | 'ADD_JOURNEY' | 'UPDATE_JOURNEY' | 'DELETE_JOURNEY' | 'SHOW_JOURNEY' | 'SUMMARIZE_JOURNEY'
  | 'ADD_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE' | 'SHOW_NOTES' | 'SEARCH_NOTES'
  | 'LOG_PROGRESS' | 'SHOW_PROGRESS' | 'SHOW_CAREER_SUMMARY' | 'SHOW_NEAREST_DEADLINE' | 'SHOW_TODAYS_MISSION'
  | 'GENERATE_PLAN' | 'GENERATE_CODE' | 'EXPLAIN_CONCEPT' | 'COMPARE'
  | 'CAREER_REVIEW' | 'CAREER_ANALYSIS' | 'CAREER_GAP_ANALYSIS' | 'CAREER_COACHING' | 'CAREER_MENTOR' | 'CAREER_PLANNING' | 'CAREER_STRATEGY' | 'CAREER_PRIORITY' | 'CAREER_PROGRESS' | 'ROADMAP_GENERATION' | 'WEEKLY_PLAN' | 'MONTHLY_PLAN' | 'SELF_REVIEW'
  | 'GENERAL_CHAT' | 'UNKNOWN';

export type IntentEntityType = 'goal' | 'opportunity' | 'journey' | 'note' | 'progress' | 'dashboard' | null;
export interface ClassifiedIntent { intent: CareerOSIntent; entityType: IntentEntityType; entityName?: string; confidence: number; requiresConfirmation: boolean; }
import type { AIProvider } from './AIProvider';
import type { NovaChatContext } from './types';

const intents: CareerOSIntent[] = ['ADD_GOAL', 'UPDATE_GOAL', 'DELETE_GOAL', 'SHOW_GOALS', 'ADD_OPPORTUNITY', 'UPDATE_OPPORTUNITY', 'DELETE_OPPORTUNITY', 'SHOW_OPPORTUNITIES', 'ADD_JOURNEY', 'UPDATE_JOURNEY', 'DELETE_JOURNEY', 'SHOW_JOURNEY', 'SUMMARIZE_JOURNEY', 'ADD_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE', 'SHOW_NOTES', 'SEARCH_NOTES', 'LOG_PROGRESS', 'SHOW_PROGRESS', 'SHOW_CAREER_SUMMARY', 'SHOW_NEAREST_DEADLINE', 'SHOW_TODAYS_MISSION', 'GENERATE_PLAN', 'GENERATE_CODE', 'EXPLAIN_CONCEPT', 'COMPARE', 'CAREER_REVIEW', 'CAREER_ANALYSIS', 'CAREER_GAP_ANALYSIS', 'CAREER_COACHING', 'CAREER_MENTOR', 'CAREER_PLANNING', 'CAREER_STRATEGY', 'CAREER_PRIORITY', 'CAREER_PROGRESS', 'ROADMAP_GENERATION', 'WEEKLY_PLAN', 'MONTHLY_PLAN', 'SELF_REVIEW', 'GENERAL_CHAT', 'UNKNOWN'];

/** Provider-neutral boundary for deciding Nova routing. */
export class IntentClassifier {
  async classify(message: string, provider: AIProvider, context: NovaChatContext): Promise<ClassifiedIntent> {
    try { return this.parse(await provider.generateText({ message: this.prompt(message), history: [], context })); } catch { return this.unknown(); }
  }

  prompt(message: string): string {
    return `Classify the CareerOS user request. Return JSON only, with no markdown or explanation.\nAllowed intents: ${intents.join(', ')}.\nSchema: {"intent":"...","entityType":"goal|opportunity|journey|note|progress|dashboard|null","entityName":"optional","confidence":0.0,"requiresConfirmation":true|false}.\nUse UNKNOWN for low confidence. Deletes require confirmation.\nUser message: ${JSON.stringify(message)}`;
  }

  private parse(value: string): ClassifiedIntent {
    const raw = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const result: unknown = JSON.parse(raw);
    if (!result || typeof result !== 'object') return this.unknown();
    const data = result as Record<string, unknown>;
    const intent = typeof data.intent === 'string' && intents.includes(data.intent as CareerOSIntent) ? data.intent as CareerOSIntent : 'UNKNOWN';
    const confidence = typeof data.confidence === 'number' && Number.isFinite(data.confidence) ? Math.max(0, Math.min(1, data.confidence)) : 0;
    const entityType = ['goal', 'opportunity', 'journey', 'note', 'progress', 'dashboard'].includes(String(data.entityType)) ? data.entityType as IntentEntityType : null;
    return { intent: confidence < 0.5 ? 'UNKNOWN' : intent, entityType, entityName: typeof data.entityName === 'string' ? data.entityName.trim() || undefined : undefined, confidence, requiresConfirmation: Boolean(data.requiresConfirmation) || intent.startsWith('DELETE_') };
  }
  private unknown(): ClassifiedIntent { return { intent: 'UNKNOWN', entityType: null, confidence: 0, requiresConfirmation: false }; }
}
