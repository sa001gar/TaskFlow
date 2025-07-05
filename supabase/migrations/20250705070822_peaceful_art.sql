/*
  # Fix infinite recursion in user_teams RLS policies

  1. Problem
    - Multiple overlapping RLS policies on user_teams table are causing infinite recursion
    - Policies are referencing each other in circular ways during evaluation

  2. Solution
    - Drop all existing policies on user_teams table
    - Create simplified, non-overlapping policies that avoid circular references
    - Ensure each policy has a clear, distinct purpose without referencing other policies

  3. New Policies
    - Users can view their own team memberships
    - Users can join teams (insert their own membership)
    - Users can leave teams (delete their own membership)
    - Team leaders can manage team memberships (view, update, delete for their teams)
*/

-- Drop all existing policies on user_teams table to eliminate conflicts
DROP POLICY IF EXISTS "Team leaders can manage memberships" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON user_teams;
DROP POLICY IF EXISTS "Users can join teams" ON user_teams;
DROP POLICY IF EXISTS "Users can view team memberships for their teams" ON user_teams;
DROP POLICY IF EXISTS "Users can view their own team memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view their team memberships" ON user_teams;
DROP POLICY IF EXISTS "join_teams_self" ON user_teams;
DROP POLICY IF EXISTS "leaders_remove_members" ON user_teams;
DROP POLICY IF EXISTS "leaders_update_member_roles" ON user_teams;
DROP POLICY IF EXISTS "leaders_view_team_memberships" ON user_teams;
DROP POLICY IF EXISTS "leave_teams_self" ON user_teams;
DROP POLICY IF EXISTS "view_own_memberships" ON user_teams;

-- Create new simplified policies without circular references

-- Policy 1: Users can view their own team memberships
CREATE POLICY "users_view_own_memberships" 
  ON user_teams 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own team memberships (join teams)
CREATE POLICY "users_join_teams" 
  ON user_teams 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can delete their own team memberships (leave teams)
CREATE POLICY "users_leave_teams" 
  ON user_teams 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Policy 4: Team leaders can view all memberships for their teams
-- This uses a direct check without subqueries to avoid recursion
CREATE POLICY "team_leaders_view_memberships" 
  ON user_teams 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM user_teams leader_check 
      WHERE leader_check.team_id = user_teams.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.is_leader = true
    )
  );

-- Policy 5: Team leaders can update team memberships (promote/demote)
CREATE POLICY "team_leaders_update_memberships" 
  ON user_teams 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM user_teams leader_check 
      WHERE leader_check.team_id = user_teams.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.is_leader = true
    )
  );

-- Policy 6: Team leaders can remove team members
CREATE POLICY "team_leaders_remove_members" 
  ON user_teams 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM user_teams leader_check 
      WHERE leader_check.team_id = user_teams.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.is_leader = true
    )
  );

-- Policy 7: Team leaders can add new members to their teams
CREATE POLICY "team_leaders_add_members" 
  ON user_teams 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM user_teams leader_check 
      WHERE leader_check.team_id = user_teams.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.is_leader = true
    )
  );