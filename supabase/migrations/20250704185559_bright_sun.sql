/*
  # Company-Based System Redesign

  1. New Tables
    - `companies` - Company management
    - `company_users` - User-company relationships with roles
    - Updated `teams` to belong to companies
    - Updated `users` to include company context

  2. Security
    - Company-based RLS policies
    - Role-based permissions (superuser, admin, leader, member)
    - Proper data isolation between companies

  3. Features
    - Company registration and management
    - Hierarchical user roles
    - Team management within companies
    - User invitation system
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  domain text,
  logo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Company users junction table with roles
CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('superuser', 'admin', 'leader', 'member')) DEFAULT 'member' NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now() NOT NULL,
  joined_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  UNIQUE(user_id, company_id)
);

ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Add company_id to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add company_id to users table for default company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'default_company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN default_company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'leader', 'member')) DEFAULT 'member' NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their companies" ON companies
  FOR SELECT TO authenticated USING (
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Superusers can manage their companies" ON companies
  FOR ALL TO authenticated USING (
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'superuser' AND is_active = true
    )
  );

-- Company users policies
CREATE POLICY "Users can view company members" ON company_users
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Superusers and admins can manage company users" ON company_users
  FOR ALL TO authenticated USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('superuser', 'admin') 
      AND is_active = true
    )
  );

-- User invitations policies
CREATE POLICY "Company members can view invitations" ON user_invitations
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins and leaders can create invitations" ON user_invitations
  FOR INSERT TO authenticated WITH CHECK (
    invited_by = auth.uid() AND
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('superuser', 'admin', 'leader') 
      AND is_active = true
    )
  );

-- Update teams policies for company context
DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team leaders can update teams" ON teams;

CREATE POLICY "Company members can view company teams" ON teams
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can create teams" ON teams
  FOR INSERT TO authenticated WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('superuser', 'admin', 'leader') 
      AND is_active = true
    )
  );

CREATE POLICY "Team leaders and admins can update teams" ON teams
  FOR UPDATE TO authenticated USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND (
        role IN ('superuser', 'admin') OR
        (role = 'leader' AND EXISTS (
          SELECT 1 FROM user_teams 
          WHERE team_id = teams.id AND user_id = auth.uid() AND is_leader = true
        ))
      )
      AND is_active = true
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_company_role(user_uuid uuid, company_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM company_users
  WHERE user_id = user_uuid AND company_id = company_uuid AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION is_company_member(user_uuid uuid, company_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = user_uuid AND company_id = company_uuid AND is_active = true
  );
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON user_invitations(company_id);

-- Update function for companies
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();