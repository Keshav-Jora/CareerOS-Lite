import Groq from 'groq-sdk';
import { CareerIntelligenceEngine } from '../../ai/intelligence';
import { DecisionEngine } from '../decision/DecisionEngine';
import type { AIProvider } from './AIProvider';
import { PromptBuilder } from './PromptBuilder';
import { ResponseParser } from './ResponseParser';
import type { NovaChatRequest } from './types';
import { GeminiServiceError } from './types';

/** Groq implementation of Nova's existing provider contract. */
export class GroqProvider implements AIProvider {
  readonly providerName = 'Groq';
  private readonly model = 'llama-3.1-8b-instant';
  modelName = this.model;
  private readonly promptBuilder = new PromptBuilder();
  private readonly responseParser = new ResponseParser();
  private readonly intelligenceEngine = new CareerIntelligenceEngine();
  private readonly decisionEngine = new DecisionEngine();

  async *streamChat(request: NovaChatRequest): AsyncGenerator<string, void, undefined> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
    if (!apiKey) throw new GeminiServiceError('missing-api-key', 'Groq is not configured.', false);

    // Each provider receives Nova's existing prompt and deterministic guidance unchanged.
    const stream = await new Groq({ apiKey, dangerouslyAllowBrowser: true }).chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.promptBuilder.buildSystemInstruction(this.intelligenceEngine.generate(), this.decisionEngine.analyze()) },
        { role: 'user', content: this.promptBuilder.buildInteractionInput(request.history, request.message, request.context) },
      ],
      stream: true,
    });

    let receivedText = false;
    try {
      for await (const event of stream) {
        if (event.model) this.modelName = event.model;
        const rawText = event.choices[0]?.delta?.content;
        this.responseParser.parseText(rawText);
        if (!rawText) continue;
        receivedText = true;
        yield rawText;
      }
    } catch (error) {
      throw this.toServiceError(error);
    }
    if (!receivedText) throw new GeminiServiceError('invalid-response', 'Groq returned an empty response.', false);
  }

  async generateText(request: NovaChatRequest): Promise<string> {
    let text = '';
    for await (const chunk of this.streamChat(request)) text += chunk;
    return text;
  }

  private toServiceError(error: unknown): GeminiServiceError {
    if (error instanceof GeminiServiceError) return error;
    const message = error instanceof Error ? error.message : 'Groq could not complete the request.';
    return new GeminiServiceError('provider-error', message, /rate.?limit|quota|temporar|unavailable|timeout|network|5\d\d/i.test(message));
  }
}
