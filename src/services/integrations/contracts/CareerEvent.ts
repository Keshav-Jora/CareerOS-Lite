import type { ConnectionProvider } from './Connection';

export interface CareerEvent {
  id: string;
  provider: ConnectionProvider;
  externalId: string;
  category: 'internship' | 'job' | 'online-assessment' | 'interview' | 'offer' | 'rejection' | 'hackathon' | 'certification' | 'github-project' | 'github-release' | 'github-activity';
  occurredAt: string;
  detectedAt: string;
  confidence: number;
  payload: Record<string, unknown>;
}
