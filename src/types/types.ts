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
  color?: string;
  logo?: string;
  created_at: string;
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

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number; // Add this field (in bytes)
  created_at: string;
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
  created_at?: string;
  projects?: {
    name: string;
    logo?: string;
    color: string;
  };
}