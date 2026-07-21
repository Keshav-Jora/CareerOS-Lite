const SESSION_STORAGE_KEY = 'career_os_analytics_session_id';

/** Owns an ephemeral browser session identifier and reports a session end once. */
export class SessionManager {
  private ended = false;
  private readonly sessionId: string;

  constructor(private readonly onEnd: () => void) {
    this.sessionId = this.readOrCreate();
    if (typeof window !== 'undefined') window.addEventListener('pagehide', this.end, { once: true });
  }

  get id(): string { return this.sessionId; }

  private end = (): void => {
    if (this.ended) return;
    this.ended = true;
    this.onEnd();
  };

  private readOrCreate(): string {
    if (typeof sessionStorage === 'undefined') return `session-${Date.now()}`;
    try {
      const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (existing) return existing;
      const created = crypto.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, created);
      return created;
    } catch {
      return `session-${Date.now()}`;
    }
  }
}
