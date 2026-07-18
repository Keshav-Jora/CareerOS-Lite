import type { NovaActionIntent } from './ActionTypes';

/** Deterministic, local intent detection. It deliberately does not call Gemini. */
export function detectNovaAction(message: string): NovaActionIntent {
  const value = message.trim();
  const lower = value.toLowerCase();
  const named = (pattern: RegExp) => value.match(pattern)?.[1]?.trim() ?? '';

  if (/^(add|create)\s+(?:an?\s+)?(?:opportunity|internship|hackathon)\b/i.test(value) || /\b(grid|internship|hackathon|fellowship|competition)\b/i.test(value)) return intent('add_opportunity', named(/^(?:add|create)\s+(?:an?\s+)?(?:opportunity|internship|hackathon)?\s*(.+)$/i), 0.92);
  if (/^add\s+(?!an?\s+(?:opportunity|internship|hackathon))/i.test(value)) return intent('add_skill', named(/^add\s+(.+)$/i), 0.78);
  if (/(?:delete|remove)\s+(?:this\s+)?(?:opportunity|application)/i.test(value)) return intent('delete_opportunity', named(/(?:opportunity|application)\s*(.*)$/i), 0.9, true);
  if (/archive\s+(?:this\s+)?(?:opportunity|application)/i.test(value)) return intent('archive_opportunity', named(/(?:opportunity|application)\s*(.*)$/i), 0.9, true);
  if (/(?:mark|set|change).*(?:opportunity|application).*(?:applied|interview|rejected|completed|saved)/i.test(value)) return intent('change_opportunity_status', named(/(?:opportunity|application)\s*(.+?)(?:\s+(?:to|as)\s+|$)/i), 0.76);
  if (/(?:mark|complete).*(?:course|learning|certification)/i.test(value)) return intent('complete_learning', named(/(?:mark|complete)\s+(.+?)(?:\s+(?:course|learning|certification))?(?:\s+(?:complete|completed))?$/i), 0.9);
  if (/add\s+(?:course|learning)/i.test(value)) return intent('add_learning', named(/add\s+(?:course|learning)\s+(.+)$/i), 0.85);
  if (/(?:create|add)\s+goal/i.test(value)) return intent('create_goal', named(/(?:create|add)\s+goal\s+(.+)$/i), 0.86);
  if (/(?:complete|finish)\s+goal/i.test(value)) return intent('complete_goal', named(/(?:complete|finish)\s+goal\s+(.+)$/i), 0.86);
  if (/(?:set|update).*(?:dsa).*(\d+)/i.test(value)) {
    const detected = intent('update_dsa_progress', 'DSA progress', 0.82);
    detected.parameters.value = Number(value.match(/(\d+)/)?.[1] ?? 0);
    return detected;
  }
  if (/set\s+(?:today'?s\s+)?focus\s+to/i.test(value)) return intent('set_mission_focus', named(/set\s+(?:today'?s\s+)?focus\s+to\s+(.+)$/i), 0.9);
  if (/(?:complete|skip)\s+(?:today'?s\s+)?mission/i.test(value)) return intent(lower.includes('skip') ? 'skip_mission' : 'complete_mission', 'Today’s mission', 0.9);
  return intent('unknown', '', 0);
}

function intent(type: NovaActionIntent['type'], entity: string, confidence: number, requiresConfirmation = false): NovaActionIntent {
  return { type, entity: entity || 'this item', parameters: {}, confidence, requiresConfirmation };
}
