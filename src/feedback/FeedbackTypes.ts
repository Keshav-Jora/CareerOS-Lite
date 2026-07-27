export type FeedbackKind = 'general' | 'bug' | 'feature';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface FeedbackSubmission {
  rating: number;
  kind: FeedbackKind;
  message: string;
  screenshot?: File;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  rating: number;
  kind: FeedbackKind;
  message: string;
  screenshotUrl?: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date | null;
}
