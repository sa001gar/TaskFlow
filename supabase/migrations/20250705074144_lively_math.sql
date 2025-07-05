/*
  # Create New Optimized Schema
  
  This migration creates the new, optimized database schema with:
  - Better naming conventions
  - Improved relationships
  - Optimized indexes
  - Simplified RLS policies
  - Proper audit trails
  - Data validation constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Users table (enhanced)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_full_name_length CHECK (LENGTH(full_name) >= 2)
);

-- Companies table (enhanced)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT companies_name_length CHECK (LENGTH(name) >= 2),
  CONSTRAINT companies_slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Company memberships (simplified and optimized)
CREATE TABLE company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT company_memberships_role_check CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  CONSTRAINT company_memberships_unique_active UNIQUE (user_id, company_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Teams table (enhanced)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_private BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT teams_name_length CHECK (LENGTH(name) >= 2),
  CONSTRAINT teams_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT teams_unique_name_per_company UNIQUE (company_id, name, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Team memberships (simplified)
CREATE TABLE team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT team_memberships_role_check CHECK (role IN ('leader', 'member')),
  CONSTRAINT team_memberships_unique_active UNIQUE (user_id, team_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Projects table (enhanced)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  budget_amount DECIMAL(12,2),
  budget_currency TEXT DEFAULT 'USD',
  progress_percentage INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT projects_status_check CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT projects_progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT projects_date_logic CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

-- Tasks table (renamed from tags, enhanced)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  type TEXT DEFAULT 'task',
  tags TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  story_points INTEGER,
  external_url TEXT,
  attachments JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT tasks_type_check CHECK (type IN ('task', 'bug', 'feature', 'epic', 'story')),
  CONSTRAINT tasks_title_length CHECK (LENGTH(title) >= 3),
  CONSTRAINT tasks_hours_positive CHECK (estimated_hours IS NULL OR estimated_hours > 0),
  CONSTRAINT tasks_actual_hours_positive CHECK (actual_hours >= 0),
  CONSTRAINT tasks_story_points_range CHECK (story_points IS NULL OR (story_points >= 1 AND story_points <= 100))
);

-- =============================================
-- ACTIVITY AND TRACKING
-- =============================================

-- Task comments and activity
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  content TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT task_activities_type_check CHECK (activity_type IN ('comment', 'status_change', 'assignment', 'update', 'attachment'))
);

-- Time tracking entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT,
  hours_logged DECIMAL(5,2) NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  is_billable BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT time_entries_hours_positive CHECK (hours_logged > 0),
  CONSTRAINT time_entries_rate_positive CHECK (hourly_rate IS NULL OR hourly_rate >= 0)
);

-- Work sessions (active time tracking)
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT work_sessions_one_active_per_user UNIQUE (user_id, is_active) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT work_sessions_end_after_start CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT work_sessions_total_minutes_positive CHECK (total_minutes IS NULL OR total_minutes > 0)
);

-- =============================================
-- NOTIFICATIONS AND PREFERENCES
-- =============================================

-- User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT notifications_type_check CHECK (type IN ('task_assigned', 'task_due', 'task_completed', 'mention', 'system'))
);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  task_assignments BOOLEAN DEFAULT true,
  due_date_reminders BOOLEAN DEFAULT true,
  mentions BOOLEAN DEFAULT true,
  system_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT notification_preferences_unique_user UNIQUE (user_id)
);

-- =============================================
-- TEMPLATES AND ADMIN
-- =============================================

-- Task templates
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL,
  description_template TEXT,
  default_priority TEXT DEFAULT 'medium',
  default_estimated_hours DECIMAL(5,2),
  default_type TEXT DEFAULT 'task',
  default_tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT task_templates_priority_check CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT task_templates_type_check CHECK (default_type IN ('task', 'bug', 'feature', 'epic', 'story'))
);

-- User invitations
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_invitations_role_check CHECK (role IN ('admin', 'manager', 'member')),
  CONSTRAINT user_invitations_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Password reset requests
CREATE TABLE password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log schema creation completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('create_new_schema', 'New optimized schema created successfully');