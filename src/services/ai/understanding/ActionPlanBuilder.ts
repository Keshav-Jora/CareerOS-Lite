import type { ActionEntity } from './EntityRecognitionService';
import type { ExtractedPayload } from './ExtractionService';
import type { ActionIntent, IntentConfidence } from './IntentService';
import type { ActionValidation } from './ValidationService';

export type ActionOperation = 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'complete' | 'query';
export interface ActionPlan { id: string; intent: ActionIntent | null; entity: ActionEntity | null; operation: ActionOperation; payload: ExtractedPayload; confidence: IntentConfidence; validation: ActionValidation; requiresConfirmation: boolean; sourceMessage: string; createdAt: string; }
export interface ActionPlanInput { message: string; intent: ActionIntent | null; entity: ActionEntity | null; payload: ExtractedPayload; validation: ActionValidation; confidence: IntentConfidence; }

const operationByIntent: Partial<Record<ActionIntent, ActionOperation>> = { create: 'create', update: 'update', delete: 'delete', archive: 'archive', restore: 'restore', complete: 'complete', search: 'query', show: 'query', summarize: 'query', recommend: 'query', explain: 'query', prioritize: 'query' };

/** Builds an immutable execution contract; it performs no routing or persistence. */
export class ActionPlanBuilder {
  build(input: ActionPlanInput): ActionPlan {
    const operation = input.intent ? operationByIntent[input.intent] ?? 'query' : 'query';
    return { id: `plan-${Date.now()}`, intent: input.intent, entity: input.entity, operation, payload: { ...input.payload }, confidence: input.confidence, validation: input.validation, requiresConfirmation: input.confidence === 'low' || !input.validation.valid || operation === 'delete', sourceMessage: input.message, createdAt: new Date().toISOString() };
  }
}
