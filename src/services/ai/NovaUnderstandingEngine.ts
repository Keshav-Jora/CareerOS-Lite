import { ActionPlanBuilder, type ActionPlan } from './understanding/ActionPlanBuilder';
import { EntityRecognitionService } from './understanding/EntityRecognitionService';
import { ExtractionService } from './understanding/ExtractionService';
import { IntentService, type IntentConfidence } from './understanding/IntentService';
import { ValidationService } from './understanding/ValidationService';
import { logOpportunityDebug } from '../../utils/opportunityDebug';
import type { ClassifiedIntent } from './IntentClassifier';
import type { ActionIntent } from './understanding/IntentService';
import type { ActionEntity } from './understanding/EntityRecognitionService';

/** Orchestrates understanding only; execution belongs to ActionRouter. */
export class NovaUnderstandingEngine {
  constructor(
    private readonly intents = new IntentService(),
    private readonly entities = new EntityRecognitionService(),
    private readonly extraction = new ExtractionService(),
    private readonly validation = new ValidationService(),
    private readonly plans = new ActionPlanBuilder(),
  ) {}

  understand(message: string): ActionPlan {
    try {
      logOpportunityDebug('Raw user message', 'src/services/ai/NovaUnderstandingEngine.ts', 'understand', message, message);
      const intentDetection = this.intents.detect(message);
      const entityDetection = this.entities.detectEntity(message, intentDetection.intent);
      const payload = this.extraction.extract(message, intentDetection.intent, entityDetection.entity);
      const validation = this.validation.validate(intentDetection.intent, entityDetection.entity, payload);
      return this.plans.build({
        message,
        intent: intentDetection.intent,
        entity: entityDetection.entity,
        payload,
        validation,
        confidence: lowestConfidence(intentDetection.confidence, entityDetection.confidence),
      });
    } catch {
      return this.plans.build({
        message,
        intent: null,
        entity: null,
        payload: {},
        confidence: 'low',
        validation: { valid: false, normalized: false, issues: [{ code: 'unsupported', message: 'Nova could not understand that request.' }] },
      });
    }
  }

  understandClassified(message: string, classified: ClassifiedIntent): ActionPlan {
    // Task completion must remain a mission mutation even if an upstream classifier
    // mistakes completion language for a new journey entry.
    if (/\b(?:mark|complete|finish)\s+(?:the\s+)?(?:resume|task)\b.*\b(?:complete(?:d)?|done)\b/i.test(message)) return this.understand(message);
    const intent = classifierIntent(classified.intent);
    const entity = classified.entityType === 'dashboard' ? null : classified.entityType as ActionEntity | null;
    if (!intent || !entity) return this.understand(message);
    const payload = this.extraction.extract(message, intent, entity);
    if (classified.entityName && !payload.title) payload.title = classified.entityName;
    const validation = this.validation.validate(intent, entity, payload);
    return this.plans.build({ message, intent, entity, payload, validation, confidence: classified.confidence >= 0.8 ? 'high' : classified.confidence >= 0.5 ? 'medium' : 'low' });
  }
}

function classifierIntent(intent: ClassifiedIntent['intent']): ActionIntent | null {
  if (intent.startsWith('ADD_')) return 'create';
  if (intent.startsWith('UPDATE_')) return 'update';
  if (intent.startsWith('DELETE_')) return 'delete';
  if (intent === 'LOG_PROGRESS') return 'update';
  if (intent.startsWith('SHOW_')) return 'show';
  if (intent === 'SEARCH_NOTES') return 'search';
  if (intent === 'SUMMARIZE_JOURNEY') return 'summarize';
  return null;
}

function lowestConfidence(left: IntentConfidence, right: IntentConfidence): IntentConfidence {
  const rank: Record<IntentConfidence, number> = { low: 0, medium: 1, high: 2 };
  return rank[left] <= rank[right] ? left : right;
}
