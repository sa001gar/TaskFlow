/*
  # Add Project Management System

  1. New Tables
    - `projects` - Project containers for organizing tasks
    - `project_members` - Project team assignments
    - `milestones` - Project milestones and deadlines

  2. Features
    - Project-based task organization
    - Project timelines and milestones
    - Project progress tracking
    - Project member management

  3. Security
    - Company-based project access
    - Project member permissions
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')) DEFAULT 'planning',
  priority text CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  start_date date,
  end_date date,
  budget decimal(12,2),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  project_manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('manager', 'lead', 'member', 'observer')) DEFAULT 'member',
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Add project_id to tags table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tags' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tags ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Projects policies
CREATE POLICY "Company members can view company projects"
  ON projects
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

CREATE POLICY "Company leaders can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin', 'leader')
      AND cu.is_active = true
    )
  );

CREATE POLICY "Project managers and company leaders can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    project_manager_id = auth.uid() OR
    created_by = auth.uid() OR
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin')
      AND cu.is_active = true
    )
  );

-- Project members policies
CREATE POLICY "Project members can view project memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id IN (
        SELECT cu.company_id 
        FROM company_users cu 
        WHERE cu.user_id = auth.uid() 
        AND cu.is_active = true
      )
    )
  );

CREATE POLICY "Project managers can manage project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.project_manager_id = auth.uid()
         OR p.created_by = auth.uid()
         OR p.company_id IN (
           SELECT cu.company_id 
           FROM company_users cu 
           WHERE cu.user_id = auth.uid() 
           AND cu.role IN ('superuser', 'admin')
           AND cu.is_active = true
         )
    )
  );

-- Milestones policies
CREATE POLICY "Project members can view milestones"
  ON milestones
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id IN (
        SELECT cu.company_id 
        FROM company_users cu 
        WHERE cu.user_id = auth.uid() 
        AND cu.is_active = true
      )
    )
  );

CREATE POLICY "Project managers and leads can manage milestones"
  ON milestones
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() 
        AND pm.role IN ('manager', 'lead')
    ) OR
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.project_manager_id = auth.uid()
         OR p.created_by = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_tags_project_id ON tags(project_id);

-- Function to calculate project progress
CREATE OR REPLACE FUNCTION calculate_project_progress(project_uuid uuid)
RETURNS TABLE (
  total_tasks integer,
  completed_tasks integer,
  progress_percentage decimal,
  overdue_tasks integer,
  total_estimated_hours decimal,
  total_actual_hours decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(t.id)::integer as total_tasks,
    COUNT(CASE WHEN t.status = 'Completed' THEN 1 END)::integer as completed_tasks,
    CASE 
      WHEN COUNT(t.id) > 0 
      THEN ROUND((COUNT(CASE WHEN t.status = 'Completed' THEN 1 END)::decimal / COUNT(t.id)::decimal) * 100, 2)
      ELSE 0::decimal
    END as progress_percentage,
    COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'Completed' THEN 1 END)::integer as overdue_tasks,
    COALESCE(SUM(t.estimated_hours), 0)::decimal as total_estimated_hours,
    COALESCE(SUM(t.actual_hours), 0)::decimal as total_actual_hours
  FROM tags t
  WHERE t.project_id = project_uuid;
END;
$$;

-- Function to update milestone status based on tasks
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  milestone_record milestones%ROWTYPE;
  total_tasks integer;
  completed_tasks integer;
  progress_pct integer;
BEGIN
  -- Only process if task has a project and the project has milestones
  IF NEW.project_id IS NOT NULL THEN
    -- Update all milestones for this project
    FOR milestone_record IN 
      SELECT * FROM milestones WHERE project_id = NEW.project_id
    LOOP
      -- Calculate tasks for this milestone (tasks due before or on milestone date)
      SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'Completed' THEN 1 END)
      INTO total_tasks, completed_tasks
      FROM tags 
      WHERE project_id = NEW.project_id 
        AND (due_date IS NULL OR due_date <= milestone_record.due_date);
      
      -- Calculate progress percentage
      IF total_tasks > 0 THEN
        progress_pct := (completed_tasks * 100) / total_tasks;
      ELSE
        progress_pct := 0;
      END IF;
      
      -- Update milestone
      UPDATE milestones 
      SET 
        completion_percentage = progress_pct,
        status = CASE 
          WHEN progress_pct = 100 THEN 'completed'
          WHEN progress_pct > 0 THEN 'in_progress'
          WHEN due_date < CURRENT_DATE THEN 'overdue'
          ELSE 'pending'
        END,
        updated_at = now()
      WHERE id = milestone_record.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update milestone progress when tasks change
CREATE TRIGGER update_milestone_progress_trigger
  AFTER INSERT OR UPDATE OF status, due_date, project_id ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_progress();