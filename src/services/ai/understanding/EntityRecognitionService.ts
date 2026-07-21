import type { ActionIntent, IntentConfidence } from './IntentService';

export type ActionEntity = 'opportunity' | 'journey' | 'project' | 'goal' | 'mission' | 'learning' | 'skill' | 'note' | 'certification';
export interface EntityDetection { entity: ActionEntity | null; confidence: IntentConfidence; }

interface EntityRule { entity: ActionEntity; weight: number; expression: RegExp; intents?: ActionIntent[]; }

const rules: EntityRule[] = [
  { entity: 'opportunity', weight: 3, expression: /\b(opportunity|application|internship|intern|hackathon|fellowship|competition|job|scholarship|volunteer|open source(?: program)?|training|bootcamp|grid)\b/i },
  { entity: 'journey', weight: 3, expression: /\b(journey|milestone|achievement|timeline)\b/i },
  { entity: 'project', weight: 3, expression: /\b(project|portfolio|repository|repo)\b/i },
  { entity: 'goal', weight: 3, expression: /\b(goal|objective|target)\b/i },
  { entity: 'mission', weight: 3, expression: /\b(mission|today'?s focus|daily focus)\b/i },
  { entity: 'learning', weight: 3, expression: /\b(learning|course|study|roadmap|lesson)\b/i },
  { entity: 'skill', weight: 3, expression: /\b(skill|skills|technology|tech stack)\b/i },
  { entity: 'note', weight: 3, expression: /\b(note|notes|memo|write down)\b/i },
  { entity: 'certification', weight: 3, expression: /\b(certifications?|certificates?|cert)\b/i },
  { entity: 'opportunity', weight: 1, expression: /\b(apply|deadline|interview|selected)\b/i, intents: ['create', 'update', 'delete', 'archive', 'show'] },
];

/** Identifies one canonical entity; structured field extraction is a later stage. */
export class EntityRecognitionService {
  detectEntity(message: string, intent?: ActionIntent | null): EntityDetection {
    if (!message.trim()) {
      const result = { entity: null, confidence: 'low' } as const;
      return result;
    }
    if (/\b(?:completed|finished|done)\s+today'?s mission\b/i.test(message)) {
      const result: EntityDetection = { entity: 'mission', confidence: 'high' };
      return result;
    }
    if (/\b(?:my goal is|i want (?:a|an|to become|to work at)|i aim to|my dream is|help me (?:track|get)|track my .*goal)\b/i.test(message)) {
      const result: EntityDetection = { entity: 'goal', confidence: 'high' };
      return result;
    }
    if (/\b(?:today i need to|i need to do .*today|today'?s tasks? are|help me plan today)\b/i.test(message)) {
      const result: EntityDetection = { entity: 'mission', confidence: 'high' };
      return result;
    }
    if (/\b(?:i found|remember|store|save|track this|want to apply|don't want to track|do not want to track|stop tracking|forget this)\b.*\b(?:opportunity|intern(?:ship)?|job|fellowship|scholarship|application)\b/i.test(message)) {
      const result: EntityDetection = { entity: 'opportunity', confidence: 'high' };
      return result;
    }
    if (intent === 'create' && /\b(completed|finished|built|solved)\b/i.test(message)) {
      const result: EntityDetection = { entity: 'journey', confidence: 'high' };
      return result;
    }
    const scores = rules.reduce<Map<ActionEntity, number>>((result, rule) => {
      if (rule.expression.test(message) && (!rule.intents || (intent ? rule.intents.includes(intent) : true))) result.set(rule.entity, (result.get(rule.entity) ?? 0) + rule.weight);
      return result;
    }, new Map());
    const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    if (!ranked.length) {
      const result = { entity: null, confidence: 'low' } as const;
      return result;
    }
    const [entity, score] = ranked[0];
    const result: EntityDetection = { entity, confidence: score >= 3 ? 'high' : score === 2 ? 'medium' : 'low' };
    return result;
  }
}
