import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dataService } from '../dataService';
import type { CanonicalCareerData } from '../../types/career-data';
import { getFirebaseFirestore } from '../auth/FirebaseConfig';
import { resolveConflict, type CloudEnvelope } from './ConflictResolver';
import { SyncQueue } from './SyncQueue';

export class CloudSyncService {
  private readonly queue = new SyncQueue();
  async sync(userId: string): Promise<void> {
    const db = getFirebaseFirestore(); if (!db || !navigator.onLine) { this.queue.enqueue(); return; }
    const reference = doc(db, 'careerData', userId); const local = this.localEnvelope(); const snapshot = await getDoc(reference);
    const cloud = snapshot.exists() ? this.normalize(snapshot.data()) : null;
    const resolved = cloud ? resolveConflict(local, cloud) : local;
    if (resolved === local) await setDoc(reference, local); else this.applyCloud(resolved.data);
    this.queue.clear();
  }
  queueSync(): void { this.queue.enqueue(); }
  private localEnvelope(): CloudEnvelope<CanonicalCareerData> { const data = dataService.repository.getSnapshot(); return { data, updatedAt: data.updatedAt }; }
  private applyCloud(data: CanonicalCareerData): void { dataService.repository.restoreSnapshot(data); }
  private normalize(value: unknown): CloudEnvelope<CanonicalCareerData> | null {
    if (!value || typeof value !== 'object') return null;
    const envelope = value as Partial<CloudEnvelope<CanonicalCareerData>>;
    if (envelope.data?.schemaVersion === 1) return envelope as CloudEnvelope<CanonicalCareerData>;
    const legacy = envelope.data as unknown as Record<string, unknown> | undefined; if (!legacy) return null;
    const local = dataService.repository.getSnapshot();
    return { updatedAt: envelope.updatedAt ?? local.updatedAt, data: { ...local, updatedAt: envelope.updatedAt ?? local.updatedAt, opportunities: (legacy.opportunities as CanonicalCareerData['opportunities']) ?? local.opportunities, journey: (legacy.timelineEntries as CanonicalCareerData['journey']) ?? local.journey, certifications: (legacy.certificates as CanonicalCareerData['certifications']) ?? local.certifications, notes: (legacy.notes as CanonicalCareerData['notes']) ?? local.notes } };
  }
}
