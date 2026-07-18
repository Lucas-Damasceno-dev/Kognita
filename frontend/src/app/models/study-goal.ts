export interface StudyGoal {
  id: string;
  title: string;
  description?: string;
  targetHours: number;
  currentHours: number;
  deadline?: string;
  userId: string;
  createdAt: string;
  isRecurring?: boolean;
  recurrencePeriod?: string;
  streakCount?: number;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  targetHours: number;
  deadline?: string;
  isRecurring?: boolean;
  recurrencePeriod?: string;
}
