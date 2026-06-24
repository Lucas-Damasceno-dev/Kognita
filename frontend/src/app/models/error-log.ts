export interface ErrorLog {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  description: string;
  solution: string;
  createdAt: string;
}

export interface CreateErrorLogRequest {
  title: string;
  description: string;
  solution: string;
  taskId?: string;
}
