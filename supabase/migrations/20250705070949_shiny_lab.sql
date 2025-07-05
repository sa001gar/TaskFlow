/*
  # Fix infinite recursion in user_teams RLS policies

  1. Problem Analysis
    - The current RLS policies on user_teams table are causing infinite recursion
    - This happens when policies reference the same table they're protecting
    - The team_leaders_* policies are checking user_teams table within user_teams policies

  2. Solution
    - Drop all existing problematic policies
    - Create new simplified policies that avoid self-referencing
    - Use direct user ID checks instead of complex subqueries where possible

  3. Security Changes
    - Maintain security while eliminating recursion
    - Users can view their own memberships
    - Team leaders can manage their teams (but checked differently)
    - Company admins can manage all teams in their company
*/

-- Drop all existing policies on user_teams to start fresh
DROP POLICY IF EXISTS "team_leaders_add_members" ON user_teams;
DROP POLICY IF EXISTS "team_leaders_remove_members" ON user_teams;
DROP POLICY IF EXISTS "team_leaders_update_memberships" ON user_teams;
DROP POLICY IF EXISTS "team_leaders_view_memberships" ON user_teams;
DROP POLICY IF EXISTS "users_join_teams" ON user_teams;
DROP POLICY IF EXISTS "users_leave_teams" ON user_teams;
DROP POLICY IF EXISTS "users_view_own_memberships" ON user_teams;

-- Create new non-recursive policies

-- Users can always view their own team memberships
CREATE POLICY "users_can_view_own_memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can join teams (but this should typically be controlled by invitations)
CREATE POLICY "users_can_join_teams"
  ON user_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave teams they're members of
CREATE POLICY "users_can_leave_teams"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Company admins can manage all team memberships in their company
CREATE POLICY "company_admins_manage_team_memberships"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN company_users cu ON cu.company_id = t.company_id
      WHERE t.id = user_teams.team_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('superuser', 'admin', 'leader')
        AND cu.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN company_users cu ON cu.company_id = t.company_id
      WHERE t.id = user_teams.team_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('superuser', 'admin', 'leader')
        AND cu.is_active = true
    )
  );

-- Team leaders can manage memberships for their specific teams
-- This uses a function to avoid recursion
CREATE OR REPLACE FUNCTION is_team_leader(team_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_teams ut
    WHERE ut.team_id = team_uuid
      AND ut.user_id = user_uuid
      AND ut.is_leader = true
  );
$$;

CREATE POLICY "team_leaders_manage_memberships"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (is_team_leader(team_id, auth.uid()))
  WITH CHECK (is_team_leader(team_id, auth.uid()));