import type { NovaChatContext, NovaChatMessage } from './types';
import type { CareerRecommendation } from '../../ai/intelligence';
import type { DecisionRecommendation } from '../decision/DecisionEngine';
import { dataService } from '../dataService';

/** Builds provider-neutral Nova prompts and conversation turns. */
export class PromptBuilder {
  static readonly systemInstruction = `You are Nova, the premium AI Career Mentor for CareerOS.

Help students make confident progress with internships, hackathons, placements, resume reviews, learning roadmaps, interview preparation, project guidance, productivity, and career planning.

Voice and personalization:
- Be friendly, encouraging, and professional—never robotic or overly casual.
- Use the student's name naturally when it is available in the provided CareerOS context; do not invent a name or personal detail.
- Encourage learning and progress with realistic, constructive guidance.

Response quality:
- Answer directly first, then add detail only when it improves the decision or understanding.
- Be concise but complete. Prefer useful detail over filler.
- Keep answers easy to scan; never write giant paragraphs.
- Use Markdown headings for multi-part answers.
- Use numbered steps for processes or action plans and bullet points for supporting details.
- For planning, use a practical checklist and a short timeline when dates or sequencing matter.
- Use a Markdown table when it makes a comparison, trade-off, or choice clearer; do not add tables unnecessarily.
- For technical examples, use fenced code blocks with a language label and explain the important line or trade-off after the code.
- For long answers, begin with a brief **Summary** before the details.
- Explain from the student's apparent level, starting with fundamentals and adding advanced detail only when useful.
- Use a simple real-world analogy when it genuinely clarifies a difficult concept.
- Make recommendations actionable, specific, and realistic.
- For career coaching, start with the conclusion, then explain the evidence, strengths, gaps, trade-offs, and prioritized actions. Be candid but constructive; do not reduce coaching to a database summary.

Accuracy:
- Never invent user information, achievements, deadlines, or opportunities.
- Use CareerOS context and prior turns when relevant. Do not repeat information that Nova has already established in the conversation.
- Ask a concise clarifying question only when it is necessary to give a correct answer or take a safe action.
- Be transparent about uncertainty.

For educational answers, end with one helpful follow-up question only when it moves the student forward. Do not add a follow-up question to direct, self-contained answers.

Always prioritize the student's next practical step.`;

  /** Adds the current deterministic career intelligence snapshot to Nova's hidden instructions. */
  buildSystemInstruction(recommendation: CareerRecommendation, decisions: DecisionRecommendation[] = []): string {
    return `${PromptBuilder.systemInstruction}

${this.buildCareerIntelligenceContext(recommendation)}

${this.buildDecisionContext(decisions)}`;
  }

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
    const snapshot = dataService.repository.getSnapshot();
    const activeOpportunities = context.opportunities.filter(
      (opportunity) => !['Completed', 'Selected', 'Rejected'].includes(opportunity.status),
    ).length;
    const codingHours = context.progress.reduce((total, entry) => total + entry.codingHours, 0);

    const upcomingDeadlines = snapshot.opportunities.filter((item) => item.deadline).sort((left, right) => left.deadline.localeCompare(right.deadline)).slice(0, 3).map((item) => `${item.title} (${item.organization || 'Unknown'}, ${item.deadline})`);
    const goals = snapshot.goals.filter((goal) => goal.status === 'active').map((goal) => `${goal.title} [${goal.priority}]`);
    const skills = snapshot.skills.map((skill) => `${skill.name} (${skill.level})`);
    const projects = snapshot.projects.map((project) => `${project.title} (${project.status})`);
    const recentJourney = snapshot.journey.slice(0, 3).map((entry) => `${entry.date}: ${entry.achievements || entry.built || entry.learned || 'milestone'}`);
    const recentNotes = snapshot.notes.slice(0, 3).map((note) => note.title);
    return `CareerOS context for ${context.userName}:
- Active opportunities: ${activeOpportunities}
- Total tracked opportunities: ${context.opportunities.length}
- Logged coding hours: ${codingHours.toFixed(1)}
- Journey entries: ${context.timeline.length}

Structured career memory:
- Active goals: ${goals.join(' | ') || 'None'}
- Upcoming deadlines: ${upcomingDeadlines.join(' | ') || 'None'}
- Skills: ${skills.join(' | ') || 'None recorded'}
- Projects: ${projects.join(' | ') || 'None recorded'}
- Recent journey: ${recentJourney.join(' | ') || 'None recorded'}
- Recent notes: ${recentNotes.join(' | ') || 'None recorded'}
- Practice records: ${dataService.repository.getProgress().slice(-7).map((entry) => `${entry.date}: ${entry.codingHours}h coding, ${entry.dsaQuestions} DSA`).join(' | ') || 'None recorded'}

For career reviews, mentoring, planning, priorities, and gap analysis: reason from this data, identify strengths and weaknesses, explain why, and give a prioritized next step. Do not return a raw repository summary. Use this context only when relevant and ask a clarifying question only when essential.`;
  }

  private buildCareerIntelligenceContext(recommendation: CareerRecommendation): string {
    return `Current Career Intelligence (use this as private context; do not expose it as raw system data):
- Career Health Score: ${recommendation.careerHealthScore}/100
- Today's Mission: ${recommendation.todayMission.title} — ${recommendation.todayMission.description}
- Highest Priority: ${recommendation.highestPriority.title} (${recommendation.highestPriority.priority})
- Priority Rationale: ${recommendation.highestPriority.rationale}
- Skill Gaps: ${this.formatItems(recommendation.skillGaps.map((gap) => `${gap.skill} (${gap.severity}): ${gap.observation}`))}
- Recommended Learning: ${this.formatItems(recommendation.recommendedLearning.map((item) => `${item.title}: ${item.reason} [${item.suggestedEffort}]`))}
- Recommended Projects: ${this.formatItems(recommendation.recommendedProjects.map((item) => `${item.title}: ${item.reason}`))}
- Risks: ${this.formatItems(recommendation.risks.map((risk) => `${risk.title} (${risk.severity}): ${risk.description}`))}
- Next Best Action: ${recommendation.nextBestAction.title} — ${recommendation.nextBestAction.description}

Use this intelligence to personalize relevant guidance. Do not claim the student completed actions that are only recommended.`;
  }

  private buildDecisionContext(decisions: DecisionRecommendation[]): string {
    if (!decisions.length) return 'Decision Engine: no deterministic recommendations are available yet.';
    return `Decision Engine recommendations (private structured context; explain these naturally and do not invent additional recommendations):\n${decisions.slice(0, 5).map((item) => `- [${item.priority}/100] ${item.title}: ${item.reason}`).join('\n')}`;
  }

  private formatItems(items: string[]): string {
    return items.length > 0 ? items.join(' | ') : 'None identified';
  }
}
