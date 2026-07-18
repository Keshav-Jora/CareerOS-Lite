import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dataService, type AppDatabasePayload } from '../dataService';
import { getFirebaseFirestore } from '../auth/FirebaseConfig';
import { resolveConflict, type CloudEnvelope } from './ConflictResolver';
import { SyncQueue } from './SyncQueue';

export class CloudSyncService {
  private readonly queue = new SyncQueue();
  async sync(userId: string): Promise<void> {
    const db = getFirebaseFirestore(); if (!db || !navigator.onLine) { this.queue.enqueue(); return; }
    const reference = doc(db, 'careerData', userId); const local = this.localEnvelope(); const snapshot = await getDoc(reference);
    const cloud = snapshot.exists() ? snapshot.data() as CloudEnvelope<AppDatabasePayload> : null;
    const resolved = cloud ? resolveConflict(local, cloud) : local;
    if (resolved === local) await setDoc(reference, local); else this.applyCloud(resolved.data);
    this.queue.clear();
  }
  queueSync(): void { this.queue.enqueue(); }
  private localEnvelope(): CloudEnvelope<AppDatabasePayload> { const data = dataService.fetchAllData(); return { data, updatedAt: data.activities[0]?.timestamp ?? new Date().toISOString() }; }
  private applyCloud(data: AppDatabasePayload): void {
    localStorage.setItem('career_os_opportunities', JSON.stringify(data.opportunities)); localStorage.setItem('career_os_timeline', JSON.stringify(data.timelineEntries)); localStorage.setItem('career_os_progress', JSON.stringify(data.progressData)); localStorage.setItem('career_os_certificates', JSON.stringify(data.certificates)); localStorage.setItem('career_os_notes', JSON.stringify(data.notes)); localStorage.setItem('career_os_activities', JSON.stringify(data.activities)); localStorage.setItem('career_os_notifications', JSON.stringify(data.notifications));
  }
}
