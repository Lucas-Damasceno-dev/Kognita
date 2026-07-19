export interface LearningPathNode {
  id: string;
  taskId: string;
  taskTitle: string;
  subjectName?: string;
  order: number;
  completed: boolean;
  unlocked: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  nodes: LearningPathNode[];
  createdAt: string;
}
