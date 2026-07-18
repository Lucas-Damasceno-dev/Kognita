export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subjectId?: string;
  subjectName?: string;
  nextReview: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  type: string;
  options?: string;
  correctOptionIndex?: number;
  createdAt: string;
}

export interface CreateFlashcardRequest {
  question: string;
  answer: string;
  subjectId?: string | null;
  type?: string;
  options?: string | null;
  correctOptionIndex?: number | null;
}

export interface ReviewFlashcardRequest {
  rating: number;
}
