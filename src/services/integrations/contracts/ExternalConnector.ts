import type { ConnectionProvider, ExternalConnection } from './Connection';
import type { SyncResult } from './Sync';

/** Provider boundary for future Gmail and GitHub implementations. */
export interface ExternalConnector {
  readonly provider: ConnectionProvider;
  getConnection(): Promise<ExternalConnection>;
  sync(): Promise<SyncResult>;
}
