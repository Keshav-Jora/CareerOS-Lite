import { GoogleGenAI } from '@google/genai';
import { CareerIntelligenceEngine } from '../../ai/intelligence';
import { PromptBuilder } from './PromptBuilder';
import { ResponseParser } from './ResponseParser';
import type { NovaChatRequest } from './types';
import { GeminiServiceError } from './types';

interface GeminiServiceOptions {
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/** Provider boundary for Nova's Gemini text and streaming requests. */
export class GeminiService {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly promptBuilder = new PromptBuilder();
  private readonly responseParser = new ResponseParser();
  private readonly intelligenceEngine = new CareerIntelligenceEngine();

  constructor(options: GeminiServiceOptions = {}) {
    this.model = options.model ?? 'gemini-3.5-flash';
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 1;
  }

  async *streamChat(request: NovaChatRequest): AsyncGenerator<string, void, undefined> {
    const client = this.createClient();
    const recommendation = this.intelligenceEngine.generate();
    const input = this.promptBuilder.buildInteractionInput(request.history, request.message, request.context);
    let lastError: GeminiServiceError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      let receivedText = false;

      try {
        const responseStream = await this.withTimeout(client.interactions.create({
          model: this.model,
          input,
          system_instruction: this.promptBuilder.buildSystemInstruction(recommendation),
          stream: true,
        }));

        for await (const event of responseStream) {
          if (event.event_type !== 'step.delta' || event.delta.type !== 'text') continue;

          const parsed = this.responseParser.parseText(event.delta.text);
          if (parsed.success) {
            receivedText = true;
            yield parsed.text;
          }
        }

        if (!receivedText) {
          throw new GeminiServiceError('invalid-response', 'Nova received an empty response from Gemini.', false);
        }

        return;
      } catch (error) {
        const serviceError = this.toServiceError(error);
        lastError = serviceError;

        if (!serviceError.retryable || receivedText || attempt === this.maxRetries) {
          throw serviceError;
        }
      }
    }

    throw lastError ?? new GeminiServiceError('provider-error', 'Nova could not complete the request.', false);
  }

  async generateText(request: NovaChatRequest): Promise<string> {
    let responseText = '';
    for await (const chunk of this.streamChat(request)) {
      responseText += chunk;
    }
    return responseText;
  }

  private createClient(): GoogleGenAI {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new GeminiServiceError('missing-api-key', 'Nova is not configured yet. Add VITE_GEMINI_API_KEY to your environment and restart the app.', false);
    }

    return new GoogleGenAI({ apiKey });
  }

  private withTimeout<T>(request: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new GeminiServiceError('timeout', 'Nova took too long to respond. Please try again.', true));
      }, this.timeoutMs);

      request.then(
        (response) => { clearTimeout(timeout); resolve(response); },
        (error: unknown) => { clearTimeout(timeout); reject(error); },
      );
    });
  }

  private toServiceError(error: unknown): GeminiServiceError {
    if (error instanceof GeminiServiceError) return error;
    if (error instanceof TypeError) {
      return new GeminiServiceError('network-failure', 'Nova could not reach Gemini. Check your connection and try again.', true);
    }
    return new GeminiServiceError('provider-error', 'Gemini could not complete that request. Please try again.', true);
  }
}
