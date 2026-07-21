import { dataService } from '../../dataService';
import type { ConnectionProvider, ExternalConnection } from '../contracts/Connection';

const providers: ConnectionProvider[] = ['gmail', 'github'];

/** Repository-backed storage for connection metadata only; it never stores OAuth tokens. */
export class ConnectionStore {
  get(provider: ConnectionProvider): ExternalConnection {
    return dataService.repository.get<ExternalConnection>('connection', provider) ?? this.defaultConnection(provider);
  }

  getAll(): ExternalConnection[] {
    return providers.map((provider) => this.get(provider));
  }

  save(connection: ExternalConnection): ExternalConnection {
    const existing = dataService.repository.get<ExternalConnection>('connection', connection.provider);
    return existing
      ? dataService.repository.update<ExternalConnection>('connection', existing.id, connection) ?? connection
      : dataService.repository.create<ExternalConnection>('connection', connection);
  }

  private defaultConnection(provider: ConnectionProvider): ExternalConnection {
    return { id: provider, provider, status: 'disconnected', syncStatus: 'idle', careerEventCount: 0, repositoryCount: 0, updatedAt: new Date(0).toISOString() };
  }
}
