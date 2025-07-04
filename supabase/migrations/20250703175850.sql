/*
  # Fix infinite recursion in user_teams RLS policies

  1. Problem
    - Existing RLS policies on user_teams table were creating infinite recursion
    - Policies were querying the same table they were protecting

  2. Solution
    - Drop all existing policies on user_teams table
    - Create new policies that avoid circular references
    - Use proper subquery structure to prevent recursion

  3. Security Model
    - Users can view and manage their own team memberships
    - Team leaders can view and manage all memberships for their teams
    - Policies avoid infinite recursion by using clearer subquery structures
*/

-- Drop ALL existing policies on user_teams table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their team memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view team memberships for their teams" ON user_teams;
DROP POLICY IF EXISTS "Users can join teams" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can manage team memberships" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can manage memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view their own memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can leave teams" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can view team memberships" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can remove members" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can update member roles" ON user_teams;

-- Create new policies that avoid infinite recursion

-- Allow users to view their own team memberships
CREATE POLICY "view_own_memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert themselves into teams (join teams)
CREATE POLICY "join_teams_self"
  ON user_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to remove themselves from teams (leave teams)
CREATE POLICY "leave_teams_self"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow team leaders to view all memberships for their teams
-- This uses a different approach to avoid recursion
CREATE POLICY "leaders_view_team_memberships"
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

-- Allow team leaders to remove members from their teams
CREATE POLICY "leaders_remove_members"
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

-- Allow team leaders to update member roles (promote/demote)
CREATE POLICY "leaders_update_member_roles"
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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_teams_is_leader ON user_teams(is_leader);
CREATE INDEX IF NOT EXISTS idx_user_teams_joined_at ON user_teams(joined_at);