import type { ActionIntent, IntentConfidence } from './IntentService';

export type ActionEntity = 'opportunity' | 'journey' | 'project' | 'goal' | 'mission' | 'learning' | 'skill' | 'note' | 'certification';
export interface EntityDetection { entity: ActionEntity | null; confidence: IntentConfidence; }

interface EntityRule { entity: ActionEntity; weight: number; expression: RegExp; intents?: ActionIntent[]; }

const rules: EntityRule[] = [
  { entity: 'opportunity', weight: 3, expression: /\b(opportunity|application|internship|hackathon|fellowship|competition|grid)\b/i },
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
    if (!message.trim()) return { entity: null, confidence: 'low' };
    if (intent === 'create' && /\b(completed|finished|built)\b/i.test(message)) return { entity: 'journey', confidence: 'high' };
    const scores = rules.reduce<Map<ActionEntity, number>>((result, rule) => {
      if (rule.expression.test(message) && (!rule.intents || (intent ? rule.intents.includes(intent) : true))) result.set(rule.entity, (result.get(rule.entity) ?? 0) + rule.weight);
      return result;
    }, new Map());
    const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    if (!ranked.length) return { entity: null, confidence: 'low' };
    const [entity, score] = ranked[0];
    return { entity, confidence: score >= 3 ? 'high' : score === 2 ? 'medium' : 'low' };
  }
}
