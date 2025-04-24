export interface AppUser {
  id: string;
  email?: string;
  username?: string; // Added username field
  created_at: string;
  usage_count?: number | null;
  last_reset?: string | null;
  plan?: string | null;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
}