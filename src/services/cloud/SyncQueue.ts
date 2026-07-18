const KEY = 'career_os_cloud_sync_queue';
export class SyncQueue { enqueue(): void { localStorage.setItem(KEY, 'pending'); } hasPending(): boolean { return localStorage.getItem(KEY) === 'pending'; } clear(): void { localStorage.removeItem(KEY); } }
