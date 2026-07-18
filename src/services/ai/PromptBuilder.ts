import type { NovaChatContext, NovaChatMessage } from './types';

/** Builds provider-neutral Nova prompts and conversation turns. */
export class PromptBuilder {
  static readonly systemInstruction = `You are Nova, the AI Career Assistant for CareerOS.

Your mission is helping students with:

- internships
- hackathons
- placements
- resume reviews
- learning roadmaps
- interview preparation
- project guidance
- productivity
- career planning

Never invent user information.

Be accurate.

Be concise.

Think step by step.

When unsure, say you are unsure.

Always prioritize actionable advice.`;

  buildConversation(history: NovaChatMessage[], message: string, context: NovaChatContext) {
    const contextMessage = this.buildContextMessage(context);
    const turns = history
      .filter((entry) => entry.text.trim().length > 0)
      .map((entry) => ({ role: entry.role, parts: [{ text: entry.text }] }));

    return [
      { role: 'user' as const, parts: [{ text: contextMessage }] },
      ...turns,
      { role: 'user' as const, parts: [{ text: message.trim() }] },
    ];
  }

  /** Builds the text input expected by the current Gemini Interactions API. */
  buildInteractionInput(history: NovaChatMessage[], message: string, context: NovaChatContext): string {
    const conversation = history
      .filter((entry) => entry.text.trim().length > 0)
      .map((entry) => `${entry.role === 'user' ? 'Student' : 'Nova'}: ${entry.text.trim()}`)
      .join('\n');

    const historySection = conversation.length > 0
      ? `Conversation so far:\n${conversation}\n\n`
      : '';

    return `${this.buildContextMessage(context)}\n\n${historySection}Student: ${message.trim()}`;
  }

  private buildContextMessage(context: NovaChatContext): string {
    const activeOpportunities = context.opportunities.filter(
      (opportunity) => !['Completed', 'Selected', 'Rejected'].includes(opportunity.status),
    ).length;
    const codingHours = context.progress.reduce((total, entry) => total + entry.codingHours, 0);

    return `CareerOS context for ${context.userName}:
- Active opportunities: ${activeOpportunities}
- Total tracked opportunities: ${context.opportunities.length}
- Logged coding hours: ${codingHours.toFixed(1)}
- Journey entries: ${context.timeline.length}

Use this context only when it is relevant. Ask a clarifying question instead of assuming missing details.`;
  }
}
