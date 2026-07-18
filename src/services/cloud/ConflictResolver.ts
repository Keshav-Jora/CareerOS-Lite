export interface CloudEnvelope<T> { data: T; updatedAt: string; }
/** Newest-write-wins; caller retains local data when timestamps are equal to avoid silent deletion. */
export function resolveConflict<T>(local: CloudEnvelope<T>, cloud: CloudEnvelope<T>): CloudEnvelope<T> { return cloud.updatedAt > local.updatedAt ? cloud : local; }
