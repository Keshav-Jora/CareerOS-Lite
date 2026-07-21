import { logOpportunityDebug } from '../../../utils/opportunityDebug';

export type ActionIntent = 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'complete' | 'search' | 'show' | 'summarize' | 'recommend' | 'explain' | 'prioritize';
export type IntentConfidence = 'high' | 'medium' | 'low';

export interface IntentDetection { intent: ActionIntent | null; confidence: IntentConfidence; }

interface IntentPattern { intent: ActionIntent; weight: number; expression: RegExp; }

const patterns: IntentPattern[] = [
  { intent: 'delete', weight: 3, expression: /\b(delete|remove|discard|cancel)\b/i },
  { intent: 'archive', weight: 3, expression: /\barchive\b/i },
  { intent: 'restore', weight: 3, expression: /\b(restore|unarchive|bring back)\b/i },
  { intent: 'complete', weight: 3, expression: /\b(complete|finish|mark done|mark as done)\b/i },
  { intent: 'recommend', weight: 3, expression: /\b(recommend|what should i do|next best)\b/i },
  { intent: 'explain', weight: 3, expression: /\b(explain|why|how does)\b/i },
  { intent: 'summarize', weight: 3, expression: /\b(summarize|summary|recap)\b/i },
  { intent: 'show', weight: 3, expression: /\b(show|list|display|view)\b/i },
  { intent: 'search', weight: 2, expression: /\b(search|find|look for)\b/i },
  { intent: 'prioritize', weight: 2, expression: /\b(prioritize|priority|focus on)\b/i },
  { intent: 'update', weight: 2, expression: /\b(update|change(?:d)?|move|set|edit|modify)\b/i },
  { intent: 'create', weight: 2, expression: /\b(add|create|new|register|track|save)\b/i },
];

/** Detects the requested operation only; entity extraction belongs to a later stage. */
export class IntentService {
  detectIntent(message: string): ActionIntent | null { return this.detect(message).intent; }

  detect(message: string): IntentDetection {
    const value = message.trim();
    if (!value) {
      const result = { intent: null, confidence: 'low' } as const;
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/^\s*today'?s mission\b/im.test(value)) {
      const result: IntentDetection = { intent: 'create', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(?:i )?(?:completed|finished|done)\s+today'?s mission\b/i.test(value)) {
      const result: IntentDetection = { intent: 'complete', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(?:today i need to|i need to do .*today|today'?s tasks? are|help me plan today)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'create', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(?:my goal is|i want (?:a|an|to become|to work at)|i aim to|my dream is|help me (?:track|get)|track my .*goal)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'create', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(?:i found|remember|store|save|track this|want to apply)\b.*\b(?:opportunity|intern(?:ship)?|job|fellowship|scholarship|application)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'create', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(?:don't want to track|do not want to track|stop tracking|forget this)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'delete', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/\b(completed|finished|built|solved)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'create', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    if (/^\s*(update|change|changed|edit|set|modify|move)\b/i.test(value)) {
      const result: IntentDetection = { intent: 'update', confidence: 'high' };
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    const scores = patterns.reduce<Map<ActionIntent, number>>((result, pattern) => {
      if (pattern.expression.test(value)) result.set(pattern.intent, (result.get(pattern.intent) ?? 0) + pattern.weight);
      return result;
    }, new Map());
    const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    if (!ranked.length) {
      const result = { intent: null, confidence: 'low' } as const;
      logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
      return result;
    }
    const [intent, score] = ranked[0];
    const result: IntentDetection = { intent, confidence: score >= 3 ? 'high' : score === 2 ? 'medium' : 'low' };
    logOpportunityDebug('IntentService', 'src/services/ai/understanding/IntentService.ts', 'detect', message, result);
    return result;
  }
}
