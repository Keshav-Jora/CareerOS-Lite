import type { DailyProgress, Opportunity, TimelineEntry } from '../../types';

export type NovaChatRole = 'user' | 'model';

export interface NovaChatMessage {
  id: string;
  role: NovaChatRole;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  provider?: string;
  model?: string;
}

export interface NovaChatContext {
  opportunities: Opportunity[];
  progress: DailyProgress[];
  timeline: TimelineEntry[];
  userName: string;
}

export interface NovaChatRequest {
  message: string;
  history: NovaChatMessage[];
  context: NovaChatContext;
}

export type GeminiErrorCode = 'missing-api-key' | 'network-failure' | 'timeout' | 'invalid-response' | 'provider-error';

export class GeminiServiceError extends Error {
  constructor(
    public readonly code: GeminiErrorCode,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}
