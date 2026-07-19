export interface VaultSnapshot {
  id: string;
  timestamp: string;
  subjectId?: string;
  subjectName: string;
  subjectColor: string;
  durationMinutes: number;
  type: 'pomodoro' | 'practice' | 'note' | 'error_review';
  summaryTitle: string;
  notesContent?: string;
  accuracyPercent?: number;
  tags: string[];
}
