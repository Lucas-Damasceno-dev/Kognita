export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  notes?: string;
  createdAt: string;
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
  color?: string;
  notes?: string;
}
