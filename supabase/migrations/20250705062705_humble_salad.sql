/*
  # Enhanced Time Tracking System

  1. New Tables
    - `time_entries` - Detailed time tracking entries
    - `work_sessions` - Work session tracking with start/stop

  2. Features
    - Detailed time logging with descriptions
    - Work session tracking (start/stop timer)
    - Time entry categories
    - Automatic time calculations
    - Time reporting and analytics

  3. Security
    - User-specific time entries
    - Team visibility for shared tasks
*/

-- Time entries table for detailed time tracking
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  description text,
  hours_logged decimal(5,2) NOT NULL CHECK (hours_logged > 0),
  entry_date date DEFAULT CURRENT_DATE NOT NULL,
  category text CHECK (category IN ('development', 'testing', 'review', 'meeting', 'research', 'documentation', 'other')) DEFAULT 'other',
  billable boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Work sessions table for timer functionality
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  description text,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  total_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Time entries policies
CREATE POLICY "Users can view their own time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view time entries for accessible tags"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    tag_id IN (
      SELECT t.id FROM tags t
      WHERE t.created_by = auth.uid() 
         OR t.assigned_to_user = auth.uid()
         OR (t.assigned_to_team IS NOT NULL AND 
             EXISTS (SELECT 1 FROM user_teams ut 
                    WHERE ut.team_id = t.assigned_to_team 
                      AND ut.user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can create their own time entries"
  ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries"
  ON time_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries"
  ON time_entries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Work sessions policies
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own work sessions"
  ON work_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_tag_id ON time_entries(tag_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_category ON time_entries(category);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_tag_id ON work_sessions(tag_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_is_active ON work_sessions(is_active);

-- Function to start work session
CREATE OR REPLACE FUNCTION start_work_session(
  task_id uuid,
  session_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- End any active sessions for this user
  UPDATE work_sessions 
  SET ended_at = now(),
      total_minutes = EXTRACT(EPOCH FROM (now() - started_at)) / 60,
      is_active = false
  WHERE user_id = auth.uid() 
    AND is_active = true;
  
  -- Start new session
  INSERT INTO work_sessions (
    user_id,
    tag_id,
    description,
    started_at,
    is_active
  ) VALUES (
    auth.uid(),
    task_id,
    session_description,
    now(),
    true
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to end work session
CREATE OR REPLACE FUNCTION end_work_session(
  session_id uuid,
  create_time_entry boolean DEFAULT true
)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record work_sessions%ROWTYPE;
  hours_worked decimal(5,2);
BEGIN
  -- Get and update session
  UPDATE work_sessions 
  SET ended_at = now(),
      total_minutes = EXTRACT(EPOCH FROM (now() - started_at)) / 60,
      is_active = false
  WHERE id = session_id 
    AND user_id = auth.uid()
    AND is_active = true
  RETURNING * INTO session_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active session not found';
  END IF;
  
  hours_worked := session_record.total_minutes / 60.0;
  
  -- Create time entry if requested
  IF create_time_entry AND hours_worked > 0 THEN
    INSERT INTO time_entries (
      user_id,
      tag_id,
      description,
      hours_logged,
      entry_date
    ) VALUES (
      auth.uid(),
      session_record.tag_id,
      session_record.description,
      hours_worked,
      CURRENT_DATE
    );
    
    -- Update tag actual hours
    UPDATE tags 
    SET actual_hours = actual_hours + hours_worked
    WHERE id = session_record.tag_id;
  END IF;
  
  RETURN hours_worked;
END;
$$;

-- Function to get time summary for a tag
CREATE OR REPLACE FUNCTION get_tag_time_summary(task_id uuid)
RETURNS TABLE (
  total_logged_hours decimal,
  total_entries integer,
  last_entry_date date,
  categories_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(te.hours_logged), 0) as total_logged_hours,
    COUNT(te.id)::integer as total_entries,
    MAX(te.entry_date) as last_entry_date,
    COALESCE(
      jsonb_object_agg(
        te.category, 
        SUM(te.hours_logged)
      ) FILTER (WHERE te.category IS NOT NULL),
      '{}'::jsonb
    ) as categories_breakdown
  FROM time_entries te
  WHERE te.tag_id = task_id
    AND (
      te.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM tags t
        WHERE t.id = task_id
          AND (t.created_by = auth.uid() 
               OR t.assigned_to_user = auth.uid()
               OR (t.assigned_to_team IS NOT NULL AND 
                   EXISTS (SELECT 1 FROM user_teams ut 
                          WHERE ut.team_id = t.assigned_to_team 
                            AND ut.user_id = auth.uid())))
      )
    );
END;
$$;