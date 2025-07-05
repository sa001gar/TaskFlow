/*
  # Fresh Database Schema for Task Management System

  1. New Tables
    - `companies` - Company information
    - `users` - User profiles linked to companies
    - `teams` - Teams within companies
    - `user_teams` - Many-to-many relationship between users and teams
    - `tags` - Tasks/tags that can be assigned to users or teams
    - `tag_comments` - Comments and status updates on tags
    - `password_resets` - Password reset requests for admin management

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for company-based access control
    - Admin and staff role-based permissions

  3. Functions
    - Helper functions for role checking and password management
*/

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS password_reset_requests CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS work_sessions CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS task_activities CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS team_memberships CASCADE;
DROP TABLE IF EXISTS company_memberships CASCADE;
DROP TABLE IF EXISTS tag_responses CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS user_teams CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_tag_updated_at() CASCADE;
DROP FUNCTION IF EXISTS log_task_activity() CASCADE;
DROP FUNCTION IF EXISTS calculate_session_duration() CASCADE;
DROP FUNCTION IF EXISTS validate_active_work_session() CASCADE;
DROP FUNCTION IF EXISTS update_task_actual_hours() CASCADE;
DROP FUNCTION IF EXISTS check_parent_task_completion() CASCADE;

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 2),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) >= 2),
  email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 2),
  description text,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  color text DEFAULT '#2b2d42' CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name, is_active)
);

-- Create user_teams junction table
CREATE TABLE user_teams (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_leader boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, team_id)
);

-- Create tags (tasks) table
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) >= 3),
  description text,
  link text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  parent_tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  due_date date,
  estimated_hours integer CHECK (estimated_hours > 0),
  actual_hours integer DEFAULT 0 CHECK (actual_hours >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tag_comments table
CREATE TABLE tag_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text,
  status_update text CHECK (status_update IN ('Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected')),
  time_logged integer DEFAULT 0 CHECK (time_logged >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create password_resets table for admin management
CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX idx_user_teams_team_id ON user_teams(team_id);
CREATE INDEX idx_tags_company_id ON tags(company_id);
CREATE INDEX idx_tags_assigned_to_user_id ON tags(assigned_to_user_id);
CREATE INDEX idx_tags_assigned_to_team_id ON tags(assigned_to_team_id);
CREATE INDEX idx_tags_created_by ON tags(created_by);
CREATE INDEX idx_tags_parent_tag_id ON tags(parent_tag_id);
CREATE INDEX idx_tags_status ON tags(status);
CREATE INDEX idx_tags_priority ON tags(priority);
CREATE INDEX idx_tags_due_date ON tags(due_date);
CREATE INDEX idx_tag_comments_tag_id ON tag_comments(tag_id);
CREATE INDEX idx_tag_comments_user_id ON tag_comments(user_id);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin of company
CREATE OR REPLACE FUNCTION is_company_admin(user_id uuid, company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND users.company_id = is_company_admin.company_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's company
CREATE OR REPLACE FUNCTION get_user_company(user_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT company_id FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (id = get_user_company(auth.uid()));

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (is_company_admin(auth.uid(), id))
  WITH CHECK (is_company_admin(auth.uid(), id));

CREATE POLICY "Anyone can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for users
CREATE POLICY "Users can view company members"
  ON users FOR SELECT
  TO authenticated
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage company users"
  ON users FOR ALL
  TO authenticated
  USING (is_company_admin(auth.uid(), company_id))
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "System can insert user profiles"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR is_company_admin(auth.uid(), company_id));

-- RLS Policies for teams
CREATE POLICY "Users can view company teams"
  ON teams FOR SELECT
  TO authenticated
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (is_company_admin(auth.uid(), company_id))
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Team leaders can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams 
      WHERE team_id = teams.id 
      AND user_id = auth.uid() 
      AND is_leader = true
    )
  );

-- RLS Policies for user_teams
CREATE POLICY "Users can view team memberships"
  ON user_teams FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id 
      AND is_company_admin(auth.uid(), company_id)
    )
  );

CREATE POLICY "Admins and team leaders can manage memberships"
  ON user_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id 
      AND is_company_admin(auth.uid(), company_id)
    ) OR
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = user_teams.team_id 
      AND ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id 
      AND is_company_admin(auth.uid(), company_id)
    ) OR
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = user_teams.team_id 
      AND ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  );

-- RLS Policies for tags
CREATE POLICY "Users can view accessible tags"
  ON tags FOR SELECT
  TO authenticated
  USING (
    company_id = get_user_company(auth.uid()) AND (
      created_by = auth.uid() OR
      assigned_to_user_id = auth.uid() OR
      assigned_to_team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = auth.uid()
      ) OR
      is_company_admin(auth.uid(), company_id)
    )
  );

CREATE POLICY "Users can create tags in their company"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id = get_user_company(auth.uid())
  );

CREATE POLICY "Users can update their tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    company_id = get_user_company(auth.uid()) AND (
      created_by = auth.uid() OR
      assigned_to_user_id = auth.uid() OR
      is_company_admin(auth.uid(), company_id)
    )
  );

CREATE POLICY "Admins can delete company tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    is_company_admin(auth.uid(), company_id) OR
    created_by = auth.uid()
  );

-- RLS Policies for tag_comments
CREATE POLICY "Users can view comments on accessible tags"
  ON tag_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tags 
      WHERE id = tag_id 
      AND company_id = get_user_company(auth.uid())
      AND (
        created_by = auth.uid() OR
        assigned_to_user_id = auth.uid() OR
        assigned_to_team_id IN (
          SELECT team_id FROM user_teams WHERE user_id = auth.uid()
        ) OR
        is_company_admin(auth.uid(), company_id)
      )
    )
  );

CREATE POLICY "Users can create comments on accessible tags"
  ON tag_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tags 
      WHERE id = tag_id 
      AND company_id = get_user_company(auth.uid())
      AND (
        created_by = auth.uid() OR
        assigned_to_user_id = auth.uid() OR
        assigned_to_team_id IN (
          SELECT team_id FROM user_teams WHERE user_id = auth.uid()
        ) OR
        is_company_admin(auth.uid(), company_id)
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON tag_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON tag_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for password_resets
CREATE POLICY "Admins can manage password resets"
  ON password_resets FOR ALL
  TO authenticated
  USING (is_company_admin(auth.uid(), company_id))
  WITH CHECK (is_company_admin(auth.uid(), company_id));

-- Function to create user with password
CREATE OR REPLACE FUNCTION create_user_with_password(
  user_name text,
  user_email text,
  user_password text,
  user_role text,
  user_company_id uuid
)
RETURNS json AS $$
DECLARE
  new_user_id uuid;
  auth_user_data json;
BEGIN
  -- Check if the requesting user is an admin of the company
  IF NOT is_company_admin(auth.uid(), user_company_id) THEN
    RAISE EXCEPTION 'Only company admins can create users';
  END IF;

  -- Create user in auth.users via Supabase Admin API
  -- This would typically be done via the Supabase Admin SDK in the application
  -- For now, we'll return the data needed for the frontend to handle this
  
  RETURN json_build_object(
    'name', user_name,
    'email', user_email,
    'role', user_role,
    'company_id', user_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request password reset
CREATE OR REPLACE FUNCTION request_password_reset(
  target_user_id uuid,
  requesting_company_id uuid
)
RETURNS uuid AS $$
DECLARE
  reset_id uuid;
BEGIN
  -- Check if the requesting user is an admin of the company
  IF NOT is_company_admin(auth.uid(), requesting_company_id) THEN
    RAISE EXCEPTION 'Only company admins can request password resets';
  END IF;

  -- Create password reset request
  INSERT INTO password_resets (user_id, company_id, requested_by)
  VALUES (target_user_id, requesting_company_id, auth.uid())
  RETURNING id INTO reset_id;

  RETURN reset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;