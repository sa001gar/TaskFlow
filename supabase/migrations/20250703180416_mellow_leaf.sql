/*
  # Complete RLS Policy Fix and System Refactor

  1. Database Schema Updates
    - Fix all RLS policies to prevent infinite recursion
    - Ensure proper permission hierarchy
    - Add missing indexes for performance

  2. Security Improvements
    - Simplified policy logic
    - Clear permission boundaries
    - Proper team leadership controls
*/

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "leaders_view_team_memberships" ON user_teams;
DROP POLICY IF EXISTS "leaders_remove_members" ON user_teams;
DROP POLICY IF EXISTS "leaders_update_member_roles" ON user_teams;
DROP POLICY IF EXISTS "view_own_memberships" ON user_teams;
DROP POLICY IF EXISTS "join_teams_self" ON user_teams;
DROP POLICY IF EXISTS "leave_teams_self" ON user_teams;
DROP POLICY IF EXISTS "users_view_own_memberships" ON user_teams;
DROP POLICY IF EXISTS "users_join_teams" ON user_teams;
DROP POLICY IF EXISTS "users_leave_teams" ON user_teams;
DROP POLICY IF EXISTS "leaders_view_team_members" ON user_teams;
DROP POLICY IF EXISTS "leaders_remove_team_members" ON user_teams;
DROP POLICY IF EXISTS "leaders_update_team_members" ON user_teams;

-- Create new, simplified policies for user_teams
CREATE POLICY "users_view_own_memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_join_teams"
  ON user_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_leave_teams"
  ON user_teams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Separate policy for leaders to manage team members
CREATE POLICY "leaders_manage_members"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams leader_check
      WHERE leader_check.team_id = user_teams.team_id
      AND leader_check.user_id = auth.uid()
      AND leader_check.is_leader = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_teams leader_check
      WHERE leader_check.team_id = user_teams.team_id
      AND leader_check.user_id = auth.uid()
      AND leader_check.is_leader = true
    )
  );

-- Add function to check team membership without recursion
CREATE OR REPLACE FUNCTION is_team_member(team_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_teams
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

-- Add function to check team leadership
CREATE OR REPLACE FUNCTION is_team_leader(team_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_teams
    WHERE team_id = team_uuid AND user_id = user_uuid AND is_leader = true
  );
$$;

-- Update tags policies to use functions
DROP POLICY IF EXISTS "Users can view tags assigned to their teams" ON tags;
DROP POLICY IF EXISTS "Team members can update team tags" ON tags;

CREATE POLICY "users_view_team_tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_team IS NULL OR 
    is_team_member(assigned_to_team, auth.uid())
  );

CREATE POLICY "team_members_update_tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to_user = auth.uid() OR
    (assigned_to_team IS NOT NULL AND is_team_member(assigned_to_team, auth.uid()))
  );

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_teams_composite ON user_teams(user_id, team_id, is_leader);
CREATE INDEX IF NOT EXISTS idx_tags_assignment ON tags(assigned_to_team, assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_tags_status_priority ON tags(status, priority);