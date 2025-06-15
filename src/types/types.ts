export interface AppUser {
  id: string;
  email?: string;
  username?: string;
  created_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  aud?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Summary {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  sections?: { title: string; content: string[] }[];
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string
  project_id: string
  title: string
  due_date: string | null
  status: 'Not Started' | 'In Progress' | 'Completed'
  priority?: 'High' | 'Medium' | 'Low'
  created_at?: string
  projects?: {
    name: string
    logo?: string
    color: string
  }
}

export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  file_path: string
  uploaded_by: string
  created_at: string
  size: number
}

export interface ToolHistory {
  id: string
  project_id: string
  tool_name: string
  title: string
  created_at: string
}

export interface ProjectDoc {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectTool {
  id: string;
  project_id: string;
  tool_name: string;
  created_at: string;
  color?: string;
}

export interface ProjectAIUsage {
  id: string;
  project_id: string;
  tool_name: string;
  input?: string;
  output?: string;
  query?: string;
  response?: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  completion_percentage?: 0 | 25 | 50 | 75 | 100;
  created_at?: string;
  projects?: {
    name: string;
    logo?: string;
    color: string;
  };
}

