export type ConnectionProvider = 'gmail' | 'github';
export type ConnectionStatus = 'disconnected' | 'connected' | 'error';

export interface ExternalConnection {
  id: ConnectionProvider;
  provider: ConnectionProvider;
  status: ConnectionStatus;
  account?: string;
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'succeeded' | 'failed';
  careerEventCount: number;
  repositoryCount: number;
  updatedAt: string;
}
