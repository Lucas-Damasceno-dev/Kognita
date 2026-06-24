export interface ChallengeGoal {
  id: string;
  targetCount: number;
  currentCount: number;
  deadlineDate: string;
  userId: string;
  createdAt: string;
}

export interface CreateChallengeGoalRequest {
  targetCount: number;
  deadlineDate: string;
}
