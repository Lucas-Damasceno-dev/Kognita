export interface ImportRequest {
  name: string;
  type: 'file' | 'folder';
  children?: ImportRequest[];
}

export interface RoadmapRequest {
  title: string;
  content: string;
}

export interface CategoryTasks {
  category: string;
  tasks: string[];
}
