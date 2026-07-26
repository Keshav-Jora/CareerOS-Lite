import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { getFirebaseApp, getFirebaseFirestore } from '../services/auth/FirebaseConfig';
import type { FeedbackSubmission } from './FeedbackTypes';

/** Isolated write boundary for feedback. User-facing data stays out of analytics. */
export class FeedbackRepository {
  async submit(user: User, submission: FeedbackSubmission): Promise<void> {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Feedback is unavailable until Firebase is configured.');
    const feedback = await addDoc(collection(firestore, 'feedback'), {
      userId: user.uid,
      rating: submission.rating,
      kind: submission.kind,
      message: submission.message.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (!submission.screenshot) return;
    const app = getFirebaseApp();
    if (!app) throw new Error('Screenshot upload is unavailable until Firebase is configured.');
    const extension = submission.screenshot.name.split('.').pop()?.toLowerCase() || 'png';
    try {
      const storageRef = ref(getStorage(app), `feedback_screenshots/${user.uid}/${feedback.id}.${extension}`);
      await uploadBytes(storageRef, submission.screenshot, { contentType: submission.screenshot.type || 'image/png' });
      const screenshotUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(firestore, 'feedback', feedback.id), { screenshotUrl, updatedAt: serverTimestamp() });
    } catch {
      // The feedback document remains valid if its optional screenshot cannot upload.
    }
  }
}
