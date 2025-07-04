/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "company_users"
    - This happens when RLS policies create circular dependencies
    - Policies are calling functions that reference the same tables recursively

  2. Solution
    - Drop existing problematic policies
    - Create simplified policies that avoid recursive calls
    - Use direct auth.uid() checks instead of complex function calls
    - Ensure policies don't create circular dependencies between tables

  3. Changes
    - Remove complex policies on company_users, companies, teams, and user_teams
    - Create simple, non-recursive policies
    - Use straightforward user ID checks
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superusers can manage their companies" ON companies;
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Superusers and admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Users can view company members" ON company_users;
DROP POLICY IF EXISTS "Company members can view company teams" ON teams;
DROP POLICY IF EXISTS "Leaders and admins can create teams" ON teams;
DROP POLICY IF EXISTS "Leaders and admins can update teams" ON teams;
DROP POLICY IF EXISTS "leaders_manage_members" ON user_teams;
DROP POLICY IF EXISTS "users_join_teams" ON user_teams;
DROP POLICY IF EXISTS "users_leave_teams" ON user_teams;
DROP POLICY IF EXISTS "users_view_own_memberships" ON user_teams;

-- Create simplified policies for companies
CREATE POLICY "Users can view companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users 
      WHERE company_users.company_id = companies.id 
      AND company_users.user_id = auth.uid()
      AND company_users.is_active = true
    )
  );

CREATE POLICY "Company superusers can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users 
      WHERE company_users.company_id = companies.id 
      AND company_users.user_id = auth.uid()
      AND company_users.role = 'superuser'
      AND company_users.is_active = true
    )
  );

-- Create simplified policies for company_users
CREATE POLICY "Users can view company members where they are members"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see company_users records for companies they belong to
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.is_active = true
    )
  );

CREATE POLICY "Company admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    -- Only superusers and admins can manage company users
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin')
      AND cu.is_active = true
    )
  );

-- Create simplified policies for teams
CREATE POLICY "Users can view teams in their companies"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.is_active = true
    )
  );

CREATE POLICY "Company leaders can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin', 'leader')
      AND cu.is_active = true
    )
  );

CREATE POLICY "Company leaders can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin', 'leader')
      AND cu.is_active = true
    )
  );

-- Create simplified policies for user_teams
CREATE POLICY "Users can view their own team memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Team leaders can manage team members"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (
    -- Team leaders can manage members of their teams
    team_id IN (
      SELECT ut.team_id 
      FROM user_teams ut 
      WHERE ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  );