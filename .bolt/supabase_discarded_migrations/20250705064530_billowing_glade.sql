/*
  # Complete TaskFlow Database Schema

  1. New Tables
    - `teams` - Team management with descriptions
    - `user_teams` - Team membership with leadership roles
    - `tags` - Main task/tag system with full feature set
    - `tag_responses` - Comments and status updates system

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for secure data access
    - Proper foreign key relationships

  3. Performance
    - Optimized indexes for all query patterns
    - Efficient data retrieval structures
*/

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- User Teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  is_leader boolean DEFAULT false NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, team_id)
);

ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Tags table (main task system)
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  link text,
  status text CHECK (status IN ('Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected')) DEFAULT 'Pending' NOT NULL,
  priority text CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium' NOT NULL,
  assigned_to_user uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_team uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  due_date date,
  estimated_hours integer,
  actual_hours integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Tag responses table (comments and updates)
CREATE TABLE IF NOT EXISTS tag_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment text,
  status_update text,
  time_logged integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tag_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team leaders can update teams" ON teams;
DROP POLICY IF EXISTS "Users can view their team memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view team memberships for their teams" ON user_teams;
DROP POLICY IF EXISTS "Users can join teams" ON user_teams;
DROP POLICY IF EXISTS "Team leaders can manage memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view tags they created" ON tags;
DROP POLICY IF EXISTS "Users can view tags assigned to them" ON tags;
DROP POLICY IF EXISTS "Users can view tags assigned to their teams" ON tags;
DROP POLICY IF EXISTS "Users can create tags" ON tags;
DROP POLICY IF EXISTS "Users can update tags they created" ON tags;
DROP POLICY IF EXISTS "Assigned users can update tag status" ON tags;
DROP POLICY IF EXISTS "Team members can update team tags" ON tags;
DROP POLICY IF EXISTS "Users can view responses on accessible tags" ON tag_responses;
DROP POLICY IF EXISTS "Users can create responses on accessible tags" ON tag_responses;
DROP POLICY IF EXISTS "Users can update their responses" ON tag_responses;
DROP POLICY IF EXISTS "Users can delete their responses" ON tag_responses;

-- Teams policies
CREATE POLICY "Anyone can view teams" ON teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team leaders can update teams" ON teams
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_teams 
      WHERE user_teams.team_id = teams.id 
      AND user_teams.user_id = auth.uid()
      AND user_teams.is_leader = true
    )
  );

-- User Teams policies
CREATE POLICY "Users can view their team memberships" ON user_teams
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view team memberships for their teams" ON user_teams
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_teams ut 
      WHERE ut.team_id = user_teams.team_id 
      AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams" ON user_teams
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team leaders can manage memberships" ON user_teams
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_teams ut 
      WHERE ut.team_id = user_teams.team_id 
      AND ut.user_id = auth.uid()
      AND ut.is_leader = true
    )
  );

-- Tags policies
CREATE POLICY "Users can view tags they created" ON tags
  FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can view tags assigned to them" ON tags
  FOR SELECT TO authenticated USING (assigned_to_user = auth.uid());

CREATE POLICY "Users can view tags assigned to their teams" ON tags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_teams 
      WHERE user_teams.team_id = tags.assigned_to_team 
      AND user_teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags" ON tags
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update tags they created" ON tags
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Assigned users can update tag status" ON tags
  FOR UPDATE TO authenticated USING (assigned_to_user = auth.uid());

CREATE POLICY "Team members can update team tags" ON tags
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_teams 
      WHERE user_teams.team_id = tags.assigned_to_team 
      AND user_teams.user_id = auth.uid()
    )
  );

-- Tag responses policies
CREATE POLICY "Users can view responses on accessible tags" ON tag_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = tag_responses.tag_id 
      AND (
        tags.created_by = auth.uid() 
        OR tags.assigned_to_user = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_teams 
          WHERE user_teams.team_id = tags.assigned_to_team 
          AND user_teams.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create responses on accessible tags" ON tag_responses
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = tag_responses.tag_id 
      AND (
        tags.created_by = auth.uid() 
        OR tags.assigned_to_user = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_teams 
          WHERE user_teams.team_id = tags.assigned_to_team 
          AND user_teams.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their responses" ON tag_responses
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their responses" ON tag_responses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
CREATE INDEX IF NOT EXISTS idx_tags_assigned_to_user ON tags(assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_tags_assigned_to_team ON tags(assigned_to_team);
CREATE INDEX IF NOT EXISTS idx_tags_parent_tag_id ON tags(parent_tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_status ON tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_priority ON tags(priority);
CREATE INDEX IF NOT EXISTS idx_tags_due_date ON tags(due_date);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at);

CREATE INDEX IF NOT EXISTS idx_tag_responses_tag_id ON tag_responses(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_responses_user_id ON tag_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_responses_created_at ON tag_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_is_leader ON user_teams(is_leader);

-- Update function for tags
CREATE OR REPLACE FUNCTION update_tag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_updated_at();