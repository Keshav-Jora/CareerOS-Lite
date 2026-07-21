import { ActionPlanBuilder, type ActionPlan } from './understanding/ActionPlanBuilder';
import { EntityRecognitionService } from './understanding/EntityRecognitionService';
import { ExtractionService } from './understanding/ExtractionService';
import { IntentService, type IntentConfidence } from './understanding/IntentService';
import { ValidationService } from './understanding/ValidationService';
import { logOpportunityDebug } from '../../utils/opportunityDebug';

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
}

function lowestConfidence(left: IntentConfidence, right: IntentConfidence): IntentConfidence {
  const rank: Record<IntentConfidence, number> = { low: 0, medium: 1, high: 2 };
  return rank[left] <= rank[right] ? left : right;
}
