export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  userId: string;
  durationMinutes: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreateStudySessionRequest {
  subjectId: string;
  durationMinutes: number;
  notes?: string;
  date?: string;
}
