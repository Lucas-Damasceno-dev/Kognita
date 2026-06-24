export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  subjectId?: string;
  subjectName?: string;
  userId: string;
  dueDate?: string;
  skillCategory?: string;
  requiresProof?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  subjectId?: string;
  dueDate?: string;
  skillCategory?: string;
  requiresProof?: boolean;
}
