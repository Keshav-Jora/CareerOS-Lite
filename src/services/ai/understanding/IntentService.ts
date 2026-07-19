export type ActionIntent = 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'complete' | 'search' | 'show' | 'summarize' | 'recommend' | 'explain' | 'prioritize';
export type IntentConfidence = 'high' | 'medium' | 'low';

export interface IntentDetection { intent: ActionIntent | null; confidence: IntentConfidence; }

interface IntentPattern { intent: ActionIntent; weight: number; expression: RegExp; }

const patterns: IntentPattern[] = [
  { intent: 'delete', weight: 3, expression: /\b(delete|remove|discard)\b/i },
  { intent: 'archive', weight: 3, expression: /\barchive\b/i },
  { intent: 'restore', weight: 3, expression: /\b(restore|unarchive|bring back)\b/i },
  { intent: 'complete', weight: 3, expression: /\b(complete|finish|mark done|mark as done)\b/i },
  { intent: 'recommend', weight: 3, expression: /\b(recommend|what should i do|next best)\b/i },
  { intent: 'explain', weight: 3, expression: /\b(explain|why|how does)\b/i },
  { intent: 'summarize', weight: 3, expression: /\b(summarize|summary|recap)\b/i },
  { intent: 'show', weight: 3, expression: /\b(show|list|display|view)\b/i },
  { intent: 'search', weight: 2, expression: /\b(search|find|look for)\b/i },
  { intent: 'prioritize', weight: 2, expression: /\b(prioritize|priority|focus on)\b/i },
  { intent: 'update', weight: 2, expression: /\b(update|change|move|set|edit)\b/i },
  { intent: 'create', weight: 2, expression: /\b(add|create|new|register|track)\b/i },
];

/** Detects the requested operation only; entity extraction belongs to a later stage. */
export class IntentService {
  detectIntent(message: string): ActionIntent | null { return this.detect(message).intent; }

  detect(message: string): IntentDetection {
    const value = message.trim();
    if (!value) return { intent: null, confidence: 'low' };
    if (/^\s*today'?s mission\s*:/im.test(value)) {
      return { intent: 'create', confidence: 'high' };
    }
    if (/\b(completed|finished|built)\b/i.test(value)) {
      return { intent: 'create', confidence: 'high' };
    }
    const scores = patterns.reduce<Map<ActionIntent, number>>((result, pattern) => {
      if (pattern.expression.test(value)) result.set(pattern.intent, (result.get(pattern.intent) ?? 0) + pattern.weight);
      return result;
    }, new Map());
    const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    if (!ranked.length) return { intent: null, confidence: 'low' };
    const [intent, score] = ranked[0];
    return { intent, confidence: score >= 3 ? 'high' : score === 2 ? 'medium' : 'low' };
  }
}

