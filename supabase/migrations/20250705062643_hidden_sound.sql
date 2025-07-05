/*
  # Add Task Templates System

  1. New Tables
    - `task_templates` - Reusable task templates
    - `template_categories` - Categories for organizing templates

  2. Features
    - Company-wide task templates
    - Template categories for organization
    - Default values for common tasks
    - Template sharing between teams

  3. Security
    - Company-based access control
    - Template creation permissions
*/

-- Template categories table
CREATE TABLE IF NOT EXISTS template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- Task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES template_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  title_template text NOT NULL,
  description_template text,
  default_priority text CHECK (default_priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  default_estimated_hours integer,
  default_assigned_to_team uuid REFERENCES teams(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Template categories policies
CREATE POLICY "Company members can view template categories"
  ON template_categories
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

CREATE POLICY "Company leaders can manage template categories"
  ON template_categories
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin', 'leader')
      AND cu.is_active = true
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('superuser', 'admin', 'leader')
      AND cu.is_active = true
    )
  );

-- Task templates policies
CREATE POLICY "Company members can view public templates"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (
    is_public = true AND
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.is_active = true
    )
  );

CREATE POLICY "Users can view their own templates"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Company members can create templates"
  ON task_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT cu.company_id 
      FROM company_users cu 
      WHERE cu.user_id = auth.uid() 
      AND cu.is_active = true
    )
  );

CREATE POLICY "Users can update their own templates"
  ON task_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON task_templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_categories_company_id ON template_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_company_id ON task_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_public ON task_templates(is_public);

-- Function to create task from template
CREATE OR REPLACE FUNCTION create_task_from_template(
  template_id uuid,
  task_title text DEFAULT NULL,
  task_description text DEFAULT NULL,
  assigned_user_id uuid DEFAULT NULL,
  assigned_team_id uuid DEFAULT NULL,
  due_date_offset_days integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record task_templates%ROWTYPE;
  new_task_id uuid;
  final_title text;
  final_description text;
  final_due_date date;
BEGIN
  -- Get template
  SELECT * INTO template_record 
  FROM task_templates 
  WHERE id = template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Prepare final values
  final_title := COALESCE(task_title, template_record.title_template);
  final_description := COALESCE(task_description, template_record.description_template);
  
  IF due_date_offset_days IS NOT NULL THEN
    final_due_date := CURRENT_DATE + (due_date_offset_days || ' days')::interval;
  END IF;
  
  -- Create task
  INSERT INTO tags (
    title,
    description,
    priority,
    assigned_to_user,
    assigned_to_team,
    estimated_hours,
    due_date,
    created_by
  ) VALUES (
    final_title,
    final_description,
    template_record.default_priority,
    COALESCE(assigned_user_id, NULL),
    COALESCE(assigned_team_id, template_record.default_assigned_to_team),
    template_record.default_estimated_hours,
    final_due_date,
    auth.uid()
  ) RETURNING id INTO new_task_id;
  
  RETURN new_task_id;
END;
$$;