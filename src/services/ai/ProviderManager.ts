import type { AIProvider } from './AIProvider';
import { CerebrasProvider } from './CerebrasProvider';
import { GeminiService } from './GeminiService';
import { GroqProvider } from './GroqProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import type { NovaProviderName } from './AIRouter';
import type { NovaChatRequest } from './types';

interface ProviderEntry {
  name: string;
  provider: AIProvider & { providerName: string; modelName: string };
}

export interface NovaProviderResponse {
  text: string;
  provider: string;
  model: string;
}

/**
 * Selects Nova's providers in priority order and retries an untouched request
 * with the next provider when the current one is unavailable or rate-limited.
 */
export class ProviderManager implements AIProvider {
  private readonly providers: ProviderEntry[] = [
    { name: 'Gemini', provider: new GeminiService() },
    { name: 'Groq', provider: new GroqProvider() },
    { name: 'OpenRouter', provider: new OpenRouterProvider() },
    { name: 'Cerebras', provider: new CerebrasProvider() },
  ];
  private providerOrder: NovaProviderName[] = ['Gemini', 'Groq', 'OpenRouter', 'Cerebras'];

  /** AIRouter sets the preference; execution and fallback remain owned here. */
  setProviderOrder(order: NovaProviderName[]): void {
    this.providerOrder = order.filter((name, index, values) => values.indexOf(name) === index && this.providers.some((provider) => provider.name === name));
  }

  async *streamResponse(request: NovaChatRequest): AsyncGenerator<NovaProviderResponse, void, undefined> {
    const failures: string[] = [];

    const orderedProviders = this.providerOrder
      .map((name) => this.providers.find((provider) => provider.name === name))
      .filter((provider): provider is ProviderEntry => Boolean(provider));

    for (const { name, provider } of orderedProviders) {
      let yieldedText = false;
      const startedAt = performance.now();
      try {
        console.debug('[Nova] Trying:', name);
        // Fallback is safe only before text is yielded; switching afterward could duplicate a response.
        for await (const chunk of provider.streamChat(request)) {
          yieldedText = true;
          yield { text: chunk, provider: provider.providerName, model: provider.modelName };
        }
        console.debug('[Nova] Success:', name, provider.modelName, `${((performance.now() - startedAt) / 1000).toFixed(1)}s`);
        return;
      } catch (error) {
        const message = this.errorMessage(error);
        failures.push(`${name}: ${message}`);
        console.debug('[Nova] Failed:', name, 'Reason:', message, `${((performance.now() - startedAt) / 1000).toFixed(1)}s`);
        if (yieldedText || !this.shouldFallback(error, message)) throw error;
        console.warn(`[Nova] ${name} unavailable; trying the next AI provider.`, error);
      }
    }

    throw new Error(`All Nova AI providers failed. ${failures.join(' | ')}`);
  }

  async *streamChat(request: NovaChatRequest): AsyncGenerator<string, void, undefined> {
    for await (const response of this.streamResponse(request)) yield response.text;
  }

  async generateResponse(request: NovaChatRequest): Promise<NovaProviderResponse> {
    let text = '';
    let provider = '';
    let model = '';
    for await (const response of this.streamResponse(request)) {
      text += response.text;
      provider = response.provider;
      model = response.model;
    }
    return { text, provider, model };
  }

  async generateText(request: NovaChatRequest): Promise<string> {
    return (await this.generateResponse(request)).text;
  }

  private shouldFallback(error: unknown, message: string): boolean {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    return code === 'missing-api-key'
      || code === 'network-failure'
      || code === 'timeout'
      || /rate.?limit|quota|too_many_requests|temporar|unavailable|overload|timeout|network|5\d\d/i.test(message);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message ? error.message : 'Unknown provider failure.';
  }
}
