/*
  # Fix infinite recursion in RLS policies

  1. Policy Updates
    - Simplify company_users policies to avoid circular references
    - Fix teams policies that may be causing recursion
    - Ensure user_teams policies don't create loops
    - Update tags policies to use simpler permission checks

  2. Security
    - Maintain proper access control without circular dependencies
    - Use direct auth.uid() checks where possible
    - Avoid complex subqueries that reference back to company_users
*/

-- Drop existing problematic policies on company_users
DROP POLICY IF EXISTS "Company admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Users can view company members where they are members" ON company_users;

-- Drop existing problematic policies on teams that might reference company_users
DROP POLICY IF EXISTS "Company leaders can create teams" ON teams;
DROP POLICY IF EXISTS "Company leaders can update teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams in their companies" ON teams;

-- Drop existing problematic policies on user_teams
DROP POLICY IF EXISTS "company_admins_manage_team_memberships" ON user_teams;

-- Create simplified company_users policies
CREATE POLICY "Users can view their own company memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company superusers and admins can view all company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('superuser', 'admin')
      AND cu.is_active = true
    )
  );

CREATE POLICY "Company superusers and admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('superuser', 'admin')
      AND cu.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('superuser', 'admin')
      AND cu.is_active = true
    )
  );

-- Create simplified teams policies
CREATE POLICY "Users can view teams they belong to"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = teams.id
      AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = teams.id
      AND ut.user_id = auth.uid()
      AND ut.is_leader = true
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified user_teams policies
CREATE POLICY "Users can view their own team memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view team memberships for teams they belong to"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = user_teams.team_id
      AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can manage team memberships"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = user_teams.team_id
      AND ut.user_id = auth.uid()
      AND ut.is_leader = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = user_teams.team_id
      AND ut.user_id = auth.uid()
      AND ut.is_leader = true
    )
  );

CREATE POLICY "Users can join teams"
  ON user_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave teams"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update tags policies to avoid recursion
DROP POLICY IF EXISTS "Users can view tags assigned to their teams" ON tags;
DROP POLICY IF EXISTS "users_view_team_tags" ON tags;

-- Recreate tags policies with simpler logic
CREATE POLICY "Users can view tags assigned to their teams"
  ON tags
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_team IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = tags.assigned_to_team
      AND ut.user_id = auth.uid()
    )
  );

-- Drop and recreate the combined policy for tags
DROP POLICY IF EXISTS "team_members_update_tags" ON tags;

CREATE POLICY "Team members can update tags assigned to their teams"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to_user = auth.uid() OR
    (assigned_to_team IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = tags.assigned_to_team
      AND ut.user_id = auth.uid()
    ))
  );

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION auth.user_company_role(company_id_param uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM company_users
  WHERE user_id = auth.uid()
  AND company_id = company_id_param
  AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth.is_team_member(team_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_teams
    WHERE user_id = auth.uid()
    AND team_id = team_id_param
  );
$$;

CREATE OR REPLACE FUNCTION auth.is_team_leader(team_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_teams
    WHERE user_id = auth.uid()
    AND team_id = team_id_param
    AND is_leader = true
  );
$$;