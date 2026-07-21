import { ConnectionStore } from './ConnectionStore';
import type { ConnectionProvider, ExternalConnection } from '../contracts/Connection';

const mockAccount: Record<ConnectionProvider, string> = {
  gmail: 'gmail-placeholder@careeros.local',
  github: 'careeros-placeholder',
};

/** Local-only framework manager. Provider OAuth and APIs are intentionally not implemented. */
export class ConnectionManager {
  constructor(private readonly store = new ConnectionStore()) {}

  connect(provider: ConnectionProvider): ExternalConnection {
    return this.updateConnection(provider, { status: 'connected', account: mockAccount[provider], syncStatus: 'idle' });
  }

  disconnect(provider: ConnectionProvider): ExternalConnection {
    return this.updateConnection(provider, { status: 'disconnected', account: undefined, lastSync: undefined, syncStatus: 'idle', careerEventCount: 0, repositoryCount: 0 });
  }

  sync(provider: ConnectionProvider): ExternalConnection {
    const connection = this.getConnection(provider);
    if (connection.status !== 'connected') return connection;
    return this.updateConnection(provider, { lastSync: new Date().toISOString(), syncStatus: 'succeeded' });
  }

  getConnection(provider: ConnectionProvider): ExternalConnection { return this.store.get(provider); }
  getAllConnections(): ExternalConnection[] { return this.store.getAll(); }

  updateConnection(provider: ConnectionProvider, changes: Partial<Omit<ExternalConnection, 'id' | 'provider'>>): ExternalConnection {
    return this.store.save({ ...this.getConnection(provider), ...changes, id: provider, provider, updatedAt: new Date().toISOString() });
  }
}
