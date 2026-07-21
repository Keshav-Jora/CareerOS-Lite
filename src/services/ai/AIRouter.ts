import type { CareerOSIntent } from './IntentClassifier';

export type NovaProviderName = 'Gemini' | 'Groq' | 'OpenRouter' | 'Cerebras';
export type NovaAIRoute = 'coding' | 'debugging' | 'career' | 'resume' | 'interview' | 'planning' | 'learning' | 'research' | 'general' | 'unknown';

export interface AIRouteDecision {
  category: NovaAIRoute;
  providerOrder: NovaProviderName[];
}

const providerOrders: Record<NovaAIRoute, NovaProviderName[]> = {
  coding: ['Groq', 'OpenRouter', 'Gemini', 'Cerebras'],
  debugging: ['Groq', 'OpenRouter', 'Gemini', 'Cerebras'],
  career: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
  resume: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
  interview: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
  planning: ['Gemini', 'OpenRouter', 'Groq', 'Cerebras'],
  learning: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
  research: ['OpenRouter', 'Gemini', 'Groq', 'Cerebras'],
  general: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
  unknown: ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'],
};

/** Maps Nova's existing intent taxonomy to a deterministic provider preference. */
export class AIRouter {
  route(intent: CareerOSIntent): AIRouteDecision {
    const category = this.categoryFor(intent);
    const decision = { category, providerOrder: [...providerOrders[category]] };
    console.debug('[Nova] Intent:', category);
    console.debug('[Nova] Route:', decision.providerOrder.join(' → '));
    return decision;
  }

  private categoryFor(intent: CareerOSIntent): NovaAIRoute {
    if (intent === 'GENERATE_CODE') return 'coding';
    if (intent === 'EXPLAIN_CONCEPT') return 'learning';
    if (intent === 'COMPARE') return 'research';
    if (['GENERATE_PLAN', 'CAREER_PLANNING', 'ROADMAP_GENERATION', 'WEEKLY_PLAN', 'MONTHLY_PLAN'].includes(intent)) return 'planning';
    if (['CAREER_REVIEW', 'CAREER_ANALYSIS', 'CAREER_GAP_ANALYSIS', 'CAREER_COACHING', 'CAREER_MENTOR', 'CAREER_STRATEGY', 'CAREER_PRIORITY', 'CAREER_PROGRESS', 'SELF_REVIEW'].includes(intent)) return 'career';
    if (intent === 'UNKNOWN') return 'unknown';
    return 'general';
  }
}
