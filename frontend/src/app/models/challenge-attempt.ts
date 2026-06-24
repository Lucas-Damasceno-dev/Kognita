export interface ChallengeAttempt {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  usedAi: boolean;
  notes?: string;
  howISolved?: string;
  skillCategory?: string;
  date: string;
  createdAt: string;
}

export interface CreateChallengeAttemptRequest {
  taskId: string;
  usedAi: boolean;
  notes?: string;
  howISolved?: string;
  date?: string;
}

export interface SkillConfidence {
  name: string;
  totalChallenges: number;
  withoutAi: number;
  confidencePercent: number;
}

export interface ChallengeStats {
  skills: SkillConfidence[];
  currentStreak: number;
  totalWithoutAi: number;
  todayCompleted: boolean;
}
