-- =============================================
-- DROP ALL EXISTING POLICIES
-- =============================================

-- Drop all policies on all tables to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

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

CREATE POLICY "Users can view companies they belong to"
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

CREATE POLICY "Users can view their own memberships"
  ON company_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships in same companies"
  ON company_memberships FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_memberships cm 
      WHERE cm.user_id = auth.uid() AND cm.is_active = true
    )
  );

CREATE POLICY "Users can insert their own memberships"
  ON company_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships"
  ON company_memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships"
  ON company_memberships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company owners can manage all memberships"
  ON company_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_memberships.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_memberships.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = true
    )
  );

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

CREATE POLICY "Team creators and company admins can delete teams"
  ON teams FOR DELETE
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
-- TEAM MEMBERSHIPS POLICIES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_memberships') THEN
    EXECUTE '
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

    CREATE POLICY "Users can join teams"
      ON team_memberships FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can leave teams"
      ON team_memberships FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "Team leaders can manage memberships"
      ON team_memberships FOR ALL
      TO authenticated
      USING (
        team_id IN (
          SELECT team_id 
          FROM team_memberships 
          WHERE user_id = auth.uid() 
            AND role = ''leader'' 
            AND is_active = true
        )
      );
    ';
  END IF;
END $$;

-- =============================================
-- USER TEAMS POLICIES (Legacy table)
-- =============================================

CREATE POLICY "Users can view their own team memberships"
  ON user_teams FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join teams directly"
  ON user_teams FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave teams directly"
  ON user_teams FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Team leaders can manage team members"
  ON user_teams FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM user_teams 
      WHERE user_id = auth.uid() 
        AND is_leader = true
    )
  );

-- =============================================
-- PROJECTS TABLE POLICIES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    EXECUTE '
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
            AND role IN (''owner'', ''admin'', ''manager'') 
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

    CREATE POLICY "Project creators can delete projects"
      ON projects FOR DELETE
      TO authenticated
      USING (created_by = auth.uid());
    ';
  END IF;
END $$;

-- =============================================
-- TAGS/TASKS TABLE POLICIES
-- =============================================

CREATE POLICY "Users can view accessible tags"
  ON tags FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to_user = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_teams ut
      WHERE ut.team_id = tags.assigned_to_team
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    assigned_to_user = auth.uid()
  );

CREATE POLICY "Tag creators can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =============================================
-- TASKS TABLE POLICIES (New schema - if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    EXECUTE '
    CREATE POLICY "Users can view accessible tasks"
      ON tasks FOR SELECT
      TO authenticated
      USING (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        company_id IN (
          SELECT company_id 
          FROM company_memberships 
          WHERE user_id = auth.uid() AND is_active = true
        ) OR
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
    ';
  END IF;
END $$;

-- =============================================
-- TAG RESPONSES POLICIES
-- =============================================

CREATE POLICY "Users can view responses on accessible tags"
  ON tag_responses FOR SELECT
  TO authenticated
  USING (
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

CREATE POLICY "Users can create responses on accessible tags"
  ON tag_responses FOR INSERT
  TO authenticated
  WITH CHECK (
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

CREATE POLICY "Users can update their responses"
  ON tag_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their responses"
  ON tag_responses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- TASK ACTIVITIES POLICIES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_activities') THEN
    EXECUTE '
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
    ';
  END IF;
END $$;

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

CREATE POLICY "Users can delete their time entries"
  ON time_entries FOR DELETE
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

CREATE POLICY "Company members can view public templates"
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

CREATE POLICY "Users can view their own templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage their templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- =============================================
-- USER INVITATIONS POLICIES
-- =============================================

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

CREATE POLICY "Company admins can create invitations"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Company admins can update invitations"
  ON user_invitations FOR UPDATE
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

CREATE POLICY "Company admins can delete invitations"
  ON user_invitations FOR DELETE
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

-- =============================================
-- PASSWORD RESET POLICIES
-- =============================================

CREATE POLICY "Company admins can view password reset requests"
  ON password_reset_requests FOR SELECT
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

CREATE POLICY "Users can view their own password reset requests"
  ON password_reset_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can create password reset requests"
  ON password_reset_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    company_id IN (
      SELECT company_id 
      FROM company_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  );

CREATE POLICY "Company admins can update password reset requests"
  ON password_reset_requests FOR UPDATE
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

-- =============================================
-- TEMPLATE CATEGORIES POLICIES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_categories') THEN
    EXECUTE '
    CREATE POLICY "Company members can view template categories"
      ON template_categories FOR SELECT
      TO authenticated
      USING (
        company_id IN (
          SELECT company_id 
          FROM company_memberships 
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    CREATE POLICY "Company leaders can manage template categories"
      ON template_categories FOR ALL
      TO authenticated
      USING (
        created_by = auth.uid() OR
        company_id IN (
          SELECT company_id 
          FROM company_memberships 
          WHERE user_id = auth.uid() 
            AND role IN (''owner'', ''admin'', ''manager'') 
            AND is_active = true
        )
      );
    ';
  END IF;
END $$;