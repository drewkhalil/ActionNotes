export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          usage_count: number
          last_reset: string
          is_premium: boolean
          created_at: string
          email: string
        }
        Insert: {
          id: string
          usage_count?: number
          last_reset?: string
          is_premium?: boolean
          created_at?: string
          email: string
        }
        Update: {
          id?: string
          usage_count?: number
          last_reset?: string
          is_premium?: boolean
          created_at?: string
          email?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          stripe_subscription_id: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          plan: string
          status: string
          stripe_subscription_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string
          created_at?: string
        }
      }
      history: {
        Row: {
          id: string
          user_id: string
          type: 'lesson' | 'recap' | 'flashcards'
          title: string
          content: string
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          type: 'lesson' | 'recap' | 'flashcards'
          title: string
          content: string
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'lesson' | 'recap' | 'flashcards'
          title?: string
          content?: string
          pdf_url?: string | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          auto_save: boolean
          pdf_retention_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          auto_save?: boolean
          pdf_retention_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          auto_save?: boolean
          pdf_retention_days?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 