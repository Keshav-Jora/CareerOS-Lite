import { Opportunity, DailyProgress, TimelineEntry } from '../types';

export interface AIContext {
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timeline: TimelineEntry[];
  userLevel?: number;
  userName?: string;
}

export interface AIServiceResponse {
  text: string;
  suggestedActions?: { label: string; action: string }[];
  sources?: string[];
}

/**
 * Nova AI Service Layer (Production-Ready Placeholder)
 * 
 * TODO: FUTURE GEMINI INTEGRATION
 * When connecting to Gemini / LLM backend:
 * 1. Implement a server-side route `/api/chat` in Express / server.ts using @google/genai.
 * 2. Keep process.env.GEMINI_API_KEY secure on the server side (never expose API keys on client).
 * 3. Make an asynchronous fetch call to `/api/chat` sending { query, context }.
 * 4. Support Server-Sent Events (SSE) or ReadableStream for real-time token streaming.
 */
export class AIService {
  /**
   * Generates a context-aware response based on application state.
   */
  static async generateResponse(query: string, context: AIContext): Promise<AIServiceResponse> {
    const lowerQuery = query.toLowerCase().trim();
    const { opportunities = [], progress = [], userName = 'Student' } = context;

    // Simulate network latency / service processing time
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 1. Deadlines / Upcoming applications
    if (lowerQuery.includes('deadline') || lowerQuery.includes('upcoming') || lowerQuery.includes('due') || lowerQuery.includes('date')) {
      const activeOpps = opportunities
        .filter((o) => o.status !== 'Completed' && o.status !== 'Selected' && o.status !== 'Rejected')
        .map((o) => ({
          ...o,
          daysLeft: Math.ceil((new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft);

      if (activeOpps.length === 0) {
        return {
          text: `You currently have **no active deadlines** pending! 🌟\n\n- Visit the **Opportunities Ledger** to add new internships, hackathons, or fellowships.\n- Use **Smart Auto-Capture** to parse any job posting URL instantly.`,
        };
      }

      const deadlineList = activeOpps
        .slice(0, 4)
        .map((o) => {
          const badge = o.daysLeft <= 2 ? '⚠️ Urgent' : o.daysLeft <= 5 ? '⏳ Soon' : '📅 On Track';
          return `- **${o.title}** at **${o.organization}** \`[${o.category}]\`\n  - Due in **${o.daysLeft} days** (${o.deadline}) • Status: **${badge}**`;
        })
        .join('\n');

      return {
        text: `### 🗓️ Priority Application Deadlines\n\nHere are your nearest active deadlines:\n\n${deadlineList}\n\n**Actionable Advice:** Complete high-priority applications at least 24 hours early to prevent server load issues!`,
        suggestedActions: [
          { label: 'View Opportunities', action: 'opportunities' },
          { label: 'Prepare Resume', action: 'notes' },
        ],
      };
    }

    // 2. Daily Tasks / Plan for today
    if (lowerQuery.includes('task') || lowerQuery.includes('today') || lowerQuery.includes('do') || lowerQuery.includes('plan')) {
      const interviewOpps = opportunities.filter((o) => o.status === 'Interview');
      const todayStr = new Date().toISOString().split('T')[0];
      const todayProg = progress.find((p) => p.date === todayStr);

      const tasks: string[] = [];

      if (interviewOpps.length > 0) {
        tasks.push(`🎯 **Prep for ${interviewOpps[0].organization}**: Review System Design patterns and practice elevator pitches for **${interviewOpps[0].title}**.`);
      }

      if (!todayProg || todayProg.dsaQuestions === 0) {
        tasks.push(`💻 **Solve 2 DSA Questions**: Target Sliding Window or Dynamic Programming topics in your prep tracker.`);
      } else {
        tasks.push(`✅ **DSA Streak Active**: You solved ${todayProg.dsaQuestions} questions today! Solve 1 extra hard problem to level up.`);
      }

      tasks.push(`📝 **Update Career Memory**: Log your latest technical learnings in the Knowledge Hub or Journal.`);
      tasks.push(`🚀 **Application Outreach**: Follow up on pending applications or save 1 new opportunity.`);

      return {
        text: `### 🎯 Customized Action Plan for Today (${userName})\n\nHere are your high-impact priorities:\n\n${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\n*Execute these steps to maintain high career velocity!*`,
        suggestedActions: [
          { label: 'Log Progress', action: 'progress' },
          { label: 'Notes & Study', action: 'notes' },
        ],
      };
    }

    // 3. Progress / Stats / DSA / Coding
    if (lowerQuery.includes('progress') || lowerQuery.includes('stats') || lowerQuery.includes('coding') || lowerQuery.includes('hours') || lowerQuery.includes('dsa') || lowerQuery.includes('streak')) {
      const totalHours = progress.reduce((acc, curr) => acc + curr.codingHours, 0);
      const totalDSA = progress.reduce((acc, curr) => acc + curr.dsaQuestions, 0);

      return {
        text: `### 📊 Technical Progress Overview\n\nHere are your aggregated metrics across CareerOS:\n\n- ⏱️ **Total Coding Hours:** \`${totalHours.toFixed(1)} hrs\`\n- 🧩 **DSA Problems Solved:** \`${totalDSA} questions\`\n- 💼 **Total Saved Opportunities:** \`${opportunities.length} active\`\n\n> **Consistency Note:** Maintaining a daily streak of even 30 mins yields a 3x higher interview callback rate over a 90-day cycle!`,
        suggestedActions: [{ label: 'View Analytics', action: 'progress' }],
      };
    }

    // 4. Productivity Tips & Interview Strategy
    if (lowerQuery.includes('interview') || lowerQuery.includes('prep') || lowerQuery.includes('resume') || lowerQuery.includes('tip') || lowerQuery.includes('advice') || lowerQuery.includes('motivation')) {
      return {
        text: `### 💡 High-Impact Interview & Career Insights\n\n1. **STAR Method for Behavioral Questions**:\n   - **Situation**: Set the background briefly.\n   - **Task**: Explain your exact responsibility.\n   - **Action**: Highlight the tools, architecture, and code you personally wrote.\n   - **Result**: Quantify impact (*e.g., "Reduced latency by 35%"*).\n\n2. **Resume Tip**:\n   - Start every bullet with strong action verbs (*Architected, Engineered, Optimized, Deployed*).\n   - Pair skills with verifiable certificates or GitHub links.\n\n3. **Deep Focus Protocol**:\n   - Use 50-minute uninterrupted coding blocks followed by 10-minute mental resets.`,
      };
    }

    // 5. Default Fallback
    return {
      text: `Hello ${userName}! I am **Nova Assistant**, your context-aware career coach.\n\nI can analyze your **opportunities pipeline**, **coding progress**, and **interview readiness** in real-time.\n\nTry asking me:\n- *"What should I focus on today?"*\n- *"Show my upcoming deadlines"*\n- *"Summarize my coding stats and DSA progress"*\n- *"Give me interview preparation tips"*`,
      suggestedActions: [
        { label: 'Today Tasks', action: ' What should I focus on today?' },
        { label: 'Check Deadlines', action: 'Show my upcoming deadlines' },
      ],
    };
  }

  /**
   * Streams response character by character (or token by token) to simulate LLM streaming.
   */
  static async *streamResponse(query: string, context: AIContext, charDelayMs: number = 18): AsyncGenerator<string, void, unknown> {
    const response = await this.generateResponse(query, context);
    const text = response.text;

    let currentText = '';
    // Chunk size can be 1-3 characters for natural, smooth typing speed
    for (let i = 0; i < text.length; i += 2) {
      currentText += text.slice(i, i + 2);
      yield currentText;
      await new Promise((resolve) => setTimeout(resolve, charDelayMs));
    }

    // Ensure final text matches exactly
    if (currentText !== text) {
      yield text;
    }
  }
}
