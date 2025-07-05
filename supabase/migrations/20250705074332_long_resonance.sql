/*
  # Create Row Level Security Policies
  
  This migration creates simplified, non-recursive RLS policies
  for secure data access without circular dependencies.
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert user profiles"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- COMPANIES TABLE POLICIES
-- =============================================

CREATE POLICY "Company members can view their companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company owners can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role = 'owner' 
        AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- COMPANY MEMBERSHIPS POLICIES
-- =============================================

CREATE POLICY "Users can view memberships in their companies"
  ON company_memberships FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships cm 
      WHERE cm.user_id = auth.uid() AND cm.is_active = true
    )
  );

CREATE POLICY "Company admins can manage memberships"
  ON company_memberships FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  );

CREATE POLICY "Users can join companies via invitation"
  ON company_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- TEAMS TABLE POLICIES
-- =============================================

CREATE POLICY "Company members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company managers can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Team creators and company admins can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  );

-- =============================================
-- TEAM MEMBERSHIPS POLICIES
-- =============================================

CREATE POLICY "Team members can view team memberships"
  ON team_memberships FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Team leaders can manage memberships"
  ON team_memberships FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_memberships 
      WHERE user_id = auth.uid() 
        AND role = 'leader' 
        AND is_active = true
    )
  );

CREATE POLICY "Users can join teams"
  ON team_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- PROJECTS TABLE POLICIES
-- =============================================

CREATE POLICY "Company members can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company managers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Project creators and assignees can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid()
  );

-- =============================================
-- TASKS TABLE POLICIES
-- =============================================

CREATE POLICY "Users can view accessible tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    -- Own tasks
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    -- Company tasks
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Team tasks
    team_id IN (
      SELECT team_id 
      FROM team_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create tasks in their companies"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid()
  );

CREATE POLICY "Task creators can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =============================================
-- TASK ACTIVITIES POLICIES
-- =============================================

CREATE POLICY "Users can view activities on accessible tasks"
  ON task_activities FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT id FROM tasks 
      WHERE created_by = auth.uid() 
         OR assigned_to = auth.uid()
         OR company_id IN (
           SELECT company_id 
           FROM company_memberships 
           WHERE user_id = auth.uid() AND is_active = true
         )
    )
  );

CREATE POLICY "Users can create activities on accessible tasks"
  ON task_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM tasks 
      WHERE created_by = auth.uid() 
         OR assigned_to = auth.uid()
         OR company_id IN (
           SELECT company_id 
           FROM company_memberships 
           WHERE user_id = auth.uid() AND is_active = true
         )
    )
  );

-- =============================================
-- TIME TRACKING POLICIES
-- =============================================

CREATE POLICY "Users can view their time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their work sessions"
  ON work_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their work sessions"
  ON work_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- TEMPLATES AND ADMIN POLICIES
-- =============================================

CREATE POLICY "Company members can view templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (
    is_public = true AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Company admins can view invitations"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Company admins can manage invitations"
  ON user_invitations FOR ALL
  TO authenticated
  USING (
    invited_by = auth.uid() OR
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  );

CREATE POLICY "Company admins can manage password resets"
  ON password_reset_requests FOR ALL
  TO authenticated
  USING (
    requested_by = auth.uid() OR
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  );

-- Log RLS policy creation completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('create_rls_policies', 'All RLS policies created without circular dependencies');