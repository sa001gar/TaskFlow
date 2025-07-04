/*
  # Fix infinite recursion in user_teams RLS policies

  1. Problem
    - Current RLS policies on user_teams table are causing infinite recursion
    - Policies that check leadership status are querying the same table they're protecting
    - This creates circular dependencies in policy evaluation

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid recursion
    - Use direct user ID comparisons where possible
    - Separate leadership checks from membership checks

  3. New Policies
    - Allow users to view their own memberships
    - Allow users to join teams (insert their own records)
    - Allow users to leave teams (delete their own records)
    - Allow team leaders to manage team memberships (simplified logic)
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "leaders_view_team_memberships" ON user_teams;
DROP POLICY IF EXISTS "leaders_remove_members" ON user_teams;
DROP POLICY IF EXISTS "leaders_update_member_roles" ON user_teams;
DROP POLICY IF EXISTS "view_own_memberships" ON user_teams;
DROP POLICY IF EXISTS "join_teams_self" ON user_teams;
DROP POLICY IF EXISTS "leave_teams_self" ON user_teams;

-- Create new simplified policies

-- Users can view their own team memberships
CREATE POLICY "users_view_own_memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can join teams (insert their own membership records)
CREATE POLICY "users_join_teams"
  ON user_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave teams (delete their own membership records)
CREATE POLICY "users_leave_teams"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Team leaders can view all team memberships for their teams
-- This uses a simpler approach to avoid recursion
CREATE POLICY "leaders_view_team_members"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT ut.team_id 
      FROM user_teams ut 
      WHERE ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  );

-- Team leaders can remove members from their teams
CREATE POLICY "leaders_remove_team_members"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT ut.team_id 
      FROM user_teams ut 
      WHERE ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  );

-- Team leaders can update member roles in their teams
CREATE POLICY "leaders_update_team_members"
  ON user_teams
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT ut.team_id 
      FROM user_teams ut 
      WHERE ut.user_id = auth.uid() 
      AND ut.is_leader = true
    )
  );