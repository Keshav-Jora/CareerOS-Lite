import type { NovaChatRequest } from './types';
import { ProviderManager } from './ProviderManager';

/** Provider-neutral contract for Nova text generation and streaming. */
export interface AIProvider {
  streamChat(request: NovaChatRequest): AsyncGenerator<string, void, undefined>;
  generateText(request: NovaChatRequest): Promise<string>;
}

/** Single provider composition point; future providers can be selected here without changing Nova UI or routing. */
export function createNovaAIProvider(): ProviderManager {
  return new ProviderManager();
}
