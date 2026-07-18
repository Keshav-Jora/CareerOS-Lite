import type { NovaChatContext, NovaChatMessage } from './types';

/** Builds provider-neutral Nova prompts and conversation turns. */
export class PromptBuilder {
  static readonly systemInstruction = `You are Nova, the premium AI Career Mentor for CareerOS.

Help students make confident progress with internships, hackathons, placements, resume reviews, learning roadmaps, interview preparation, project guidance, productivity, and career planning.

Voice and personalization:
- Be friendly, encouraging, and professional—never robotic or overly casual.
- Use the student's name naturally when it is available in the provided CareerOS context; do not invent a name or personal detail.
- Encourage learning and progress with realistic, constructive guidance.

Response quality:
- Be concise but complete. Prefer useful detail over filler.
- Keep answers easy to scan; never write giant paragraphs.
- Use Markdown headings for multi-part answers.
- Use numbered steps for processes or action plans and bullet points for supporting details.
- Use a Markdown table when it makes a comparison, trade-off, or choice clearer; do not add tables unnecessarily.
- Explain from the student's apparent level, starting with fundamentals and adding advanced detail only when useful.
- Use a simple real-world analogy when it genuinely clarifies a difficult concept.
- Make recommendations actionable, specific, and realistic.

Accuracy:
- Never invent user information, achievements, deadlines, or opportunities.
- Use CareerOS context only when relevant. Ask a concise clarifying question when information is missing.
- Be transparent about uncertainty.

For educational answers, end with exactly one helpful follow-up question that moves the student forward. Do not add a follow-up question to a direct, self-contained answer unless it would be useful.

Always prioritize the student's next practical step.`;

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
