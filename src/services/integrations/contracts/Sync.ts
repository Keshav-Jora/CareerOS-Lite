import type { ConnectionProvider } from './Connection';

export interface SyncResult {
  provider: ConnectionProvider;
  status: 'idle' | 'syncing' | 'succeeded' | 'failed';
  completedAt?: string;
  errorMessage?: string;
}
