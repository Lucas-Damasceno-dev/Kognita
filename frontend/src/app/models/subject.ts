export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
  color?: string;
}
