export interface StudyNote {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}
