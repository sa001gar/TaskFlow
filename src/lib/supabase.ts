import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          timezone: string | null;
          locale: string | null;
          is_active: boolean | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          timezone?: string | null;
          locale?: string | null;
          is_active?: boolean | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          timezone?: string | null;
          locale?: string | null;
          is_active?: boolean | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_teams: {
        Row: {
          user_id: string;
          team_id: string;
          is_leader: boolean;
          joined_at: string;
        };
        Insert: {
          user_id: string;
          team_id: string;
          is_leader?: boolean;
          joined_at?: string;
        };
        Update: {
          user_id?: string;
          team_id?: string;
          is_leader?: boolean;
          joined_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          link: string | null;
          status: string;
          priority: string;
          assigned_to_user: string | null;
          assigned_to_team: string | null;
          created_by: string;
          parent_tag_id: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          actual_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          link?: string | null;
          status?: string;
          priority?: string;
          assigned_to_user?: string | null;
          assigned_to_team?: string | null;
          created_by: string;
          parent_tag_id?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          link?: string | null;
          status?: string;
          priority?: string;
          assigned_to_user?: string | null;
          assigned_to_team?: string | null;
          created_by?: string;
          parent_tag_id?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tag_responses: {
        Row: {
          id: string;
          tag_id: string;
          user_id: string;
          comment: string | null;
          status_update: string | null;
          time_logged: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tag_id: string;
          user_id: string;
          comment?: string | null;
          status_update?: string | null;
          time_logged?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tag_id?: string;
          user_id?: string;
          comment?: string | null;
          status_update?: string | null;
          time_logged?: number;
          created_at?: string;
        };
      };
    };
  };
};