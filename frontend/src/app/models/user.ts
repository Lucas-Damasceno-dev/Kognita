export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  totalExperience: number;
  githubRepo?: string;
  title?: string;
  avatarBorder?: string;
  streakCount?: number;
  lastActiveDate?: string;
  streakFreezes?: number;
  coins?: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
