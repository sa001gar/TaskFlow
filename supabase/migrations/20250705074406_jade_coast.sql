/*
  # Migrate Existing Data
  
  This migration transfers data from the backup schema to the new schema
  with appropriate transformations and data cleaning.
*/

-- =============================================
-- MIGRATE CORE ENTITIES
-- =============================================

-- Migrate users (with data transformation)
INSERT INTO users (id, email, full_name, is_active, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(name, email), -- Use email as fallback for full_name
  true, -- Default to active
  created_at,
  COALESCE(created_at, NOW()) -- Use created_at as updated_at fallback
FROM backup_schema.users
ON CONFLICT (id) DO NOTHING;

-- Migrate companies (with slug generation)
INSERT INTO companies (id, name, slug, description, website_url, is_active, created_at, updated_at)
SELECT 
  id,
  name,
  LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')), -- Generate slug from name
  description,
  domain, -- Map domain to website_url
  true, -- Default to active
  created_at,
  updated_at
FROM backup_schema.companies
ON CONFLICT (slug) DO UPDATE SET
  slug = EXCLUDED.slug || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;

-- Migrate company memberships (with role mapping)
INSERT INTO company_memberships (id, user_id, company_id, role, invited_by, joined_at, is_active, created_at, updated_at)
SELECT 
  id,
  user_id,
  company_id,
  CASE 
    WHEN role = 'superuser' THEN 'owner'
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'leader' THEN 'manager'
    ELSE 'member'
  END, -- Map old roles to new roles
  invited_by,
  COALESCE(joined_at, invited_at), -- Use invited_at as fallback
  is_active,
  invited_at, -- Use invited_at as created_at
  invited_at
FROM backup_schema.company_users
WHERE user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- Migrate teams
INSERT INTO teams (id, company_id, name, description, is_active, created_by, created_at, updated_at)
SELECT 
  t.id,
  COALESCE(t.company_id, cm.company_id), -- Get company_id from company_memberships if null
  t.name,
  t.description,
  true, -- Default to active
  COALESCE(
    (SELECT user_id FROM backup_schema.user_teams ut WHERE ut.team_id = t.id AND ut.is_leader = true LIMIT 1),
    (SELECT user_id FROM backup_schema.user_teams ut WHERE ut.team_id = t.id LIMIT 1)
  ), -- Find a leader or any member as creator
  t.created_at,
  t.created_at
FROM backup_schema.teams t
LEFT JOIN backup_schema.company_users cm ON cm.user_id = (
  SELECT user_id FROM backup_schema.user_teams ut WHERE ut.team_id = t.id LIMIT 1
)
WHERE EXISTS (SELECT 1 FROM backup_schema.user_teams ut WHERE ut.team_id = t.id); -- Only migrate teams with members

-- Migrate team memberships
INSERT INTO team_memberships (user_id, team_id, role, joined_at, is_active, created_at)
SELECT 
  user_id,
  team_id,
  CASE WHEN is_leader THEN 'leader' ELSE 'member' END,
  joined_at,
  true, -- Default to active
  joined_at
FROM backup_schema.user_teams
WHERE team_id IN (SELECT id FROM teams) -- Only migrate if team exists
  AND user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- =============================================
-- MIGRATE PROJECTS AND TASKS
-- =============================================

-- Migrate projects (with status and priority mapping)
INSERT INTO projects (id, company_id, team_id, name, description, status, priority, start_date, due_date, 
                     budget_amount, progress_percentage, is_active, created_by, assigned_to, created_at, updated_at)
SELECT 
  id,
  company_id,
  NULL, -- team_id not in old schema
  name,
  description,
  LOWER(status), -- Convert to lowercase
  LOWER(priority), -- Convert to lowercase
  start_date,
  end_date, -- Map end_date to due_date
  budget,
  0, -- Default progress
  true, -- Default to active
  created_by,
  project_manager_id, -- Map to assigned_to
  created_at,
  updated_at
FROM backup_schema.projects
WHERE company_id IN (SELECT id FROM companies) -- Only migrate if company exists
  AND created_by IN (SELECT id FROM users); -- Only migrate if creator exists

-- Migrate tasks (with comprehensive mapping)
INSERT INTO tasks (id, company_id, project_id, team_id, parent_task_id, title, description, status, priority, 
                  type, due_date, estimated_hours, actual_hours, external_url, is_active, created_by, assigned_to, 
                  created_at, updated_at)
SELECT 
  id,
  -- Get company_id from creator's membership
  (SELECT company_id FROM company_memberships WHERE user_id = t.created_by AND is_active = true LIMIT 1),
  project_id,
  assigned_to_team, -- Map to team_id
  parent_tag_id, -- Map to parent_task_id
  title,
  description,
  CASE 
    WHEN status = 'Pending' THEN 'todo'
    WHEN status = 'Accepted' THEN 'todo'
    WHEN status = 'In Progress' THEN 'in_progress'
    WHEN status = 'Completed' THEN 'done'
    WHEN status = 'Rejected' THEN 'cancelled'
    ELSE 'todo'
  END, -- Map old status to new status
  LOWER(priority), -- Convert to lowercase
  'task', -- Default type
  due_date::TIMESTAMPTZ, -- Convert date to timestamptz
  estimated_hours,
  actual_hours,
  link, -- Map to external_url
  true, -- Default to active
  created_by,
  assigned_to_user, -- Map to assigned_to
  created_at,
  updated_at
FROM backup_schema.tags t
WHERE created_by IN (SELECT id FROM users); -- Only migrate if creator exists

-- =============================================
-- MIGRATE ACTIVITY AND TRACKING
-- =============================================

-- Migrate task activities (from tag_responses)
INSERT INTO task_activities (id, task_id, user_id, activity_type, content, old_value, new_value, created_at)
SELECT 
  id,
  tag_id, -- Map to task_id
  user_id,
  CASE 
    WHEN comment IS NOT NULL AND status_update IS NOT NULL THEN 'comment'
    WHEN status_update IS NOT NULL THEN 'status_change'
    WHEN comment IS NOT NULL THEN 'comment'
    ELSE 'update'
  END,
  comment, -- Map to content
  NULL, -- old_value not available
  status_update, -- Map to new_value
  created_at
FROM backup_schema.tag_responses
WHERE tag_id IN (SELECT id FROM tasks) -- Only migrate if task exists
  AND user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- Migrate time entries
INSERT INTO time_entries (id, user_id, task_id, description, hours_logged, entry_date, is_billable, created_at, updated_at)
SELECT 
  id,
  user_id,
  tag_id, -- Map to task_id
  description,
  hours_logged,
  entry_date,
  COALESCE(billable, false), -- Map billable to is_billable
  created_at,
  updated_at
FROM backup_schema.time_entries
WHERE tag_id IN (SELECT id FROM tasks) -- Only migrate if task exists
  AND user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- Migrate work sessions
INSERT INTO work_sessions (id, user_id, task_id, description, started_at, ended_at, total_minutes, is_active, created_at)
SELECT 
  id,
  user_id,
  tag_id, -- Map to task_id
  description,
  started_at,
  ended_at,
  total_minutes,
  is_active,
  created_at
FROM backup_schema.work_sessions
WHERE tag_id IN (SELECT id FROM tasks) -- Only migrate if task exists
  AND user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- =============================================
-- MIGRATE NOTIFICATIONS AND PREFERENCES
-- =============================================

-- Migrate notifications (with type mapping)
INSERT INTO notifications (id, user_id, type, title, message, data, read_at, expires_at, created_at)
SELECT 
  id,
  user_id,
  CASE 
    WHEN type = 'task_assigned' THEN 'task_assigned'
    WHEN type = 'task_due_soon' THEN 'task_due'
    WHEN type = 'task_overdue' THEN 'task_due'
    WHEN type = 'task_status_changed' THEN 'task_completed'
    WHEN type = 'task_comment_added' THEN 'mention'
    ELSE 'system'
  END,
  title,
  message,
  data,
  read_at,
  expires_at,
  created_at
FROM backup_schema.notifications
WHERE user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- Migrate notification preferences
INSERT INTO notification_preferences (id, user_id, email_enabled, push_enabled, task_assignments, 
                                    due_date_reminders, mentions, system_updates, created_at, updated_at)
SELECT 
  id,
  user_id,
  COALESCE(email_notifications, true),
  COALESCE(push_notifications, true),
  COALESCE(task_assignments, true),
  COALESCE(due_date_reminders, true),
  COALESCE(comments, true), -- Map to mentions
  true, -- Default system_updates
  created_at,
  updated_at
FROM backup_schema.notification_preferences
WHERE user_id IN (SELECT id FROM users); -- Only migrate if user exists

-- =============================================
-- MIGRATE TEMPLATES AND ADMIN DATA
-- =============================================

-- Migrate task templates
INSERT INTO task_templates (id, company_id, name, description, title_template, description_template, 
                           default_priority, default_estimated_hours, default_type, is_public, created_by, created_at, updated_at)
SELECT 
  id,
  company_id,
  name,
  description,
  title_template,
  description_template,
  LOWER(COALESCE(default_priority, 'medium')), -- Convert to lowercase
  default_estimated_hours,
  'task', -- Default type
  COALESCE(is_public, true),
  created_by,
  created_at,
  updated_at
FROM backup_schema.task_templates
WHERE company_id IN (SELECT id FROM companies) -- Only migrate if company exists
  AND created_by IN (SELECT id FROM users); -- Only migrate if creator exists

-- Migrate user invitations (with role mapping)
INSERT INTO user_invitations (id, email, company_id, team_id, role, invited_by, token, expires_at, accepted_at, created_at)
SELECT 
  id,
  email,
  company_id,
  team_id,
  CASE 
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'leader' THEN 'manager'
    ELSE 'member'
  END, -- Map old roles to new roles
  invited_by,
  token,
  expires_at,
  accepted_at,
  created_at
FROM backup_schema.user_invitations
WHERE company_id IN (SELECT id FROM companies) -- Only migrate if company exists
  AND invited_by IN (SELECT id FROM users); -- Only migrate if inviter exists

-- Migrate password reset requests
INSERT INTO password_reset_requests (id, user_id, company_id, requested_by, token, expires_at, used_at, created_at)
SELECT 
  id,
  user_id,
  company_id,
  requested_by,
  token,
  expires_at,
  used_at,
  created_at
FROM backup_schema.password_reset_requests
WHERE user_id IN (SELECT id FROM users) -- Only migrate if user exists
  AND company_id IN (SELECT id FROM companies) -- Only migrate if company exists
  AND requested_by IN (SELECT id FROM users); -- Only migrate if requester exists

-- =============================================
-- DATA CLEANUP AND VALIDATION
-- =============================================

-- Update task actual_hours based on time entries
UPDATE tasks 
SET actual_hours = (
  SELECT COALESCE(SUM(hours_logged), 0) 
  FROM time_entries 
  WHERE task_id = tasks.id
);

-- Update project progress based on completed tasks
UPDATE projects 
SET progress_percentage = (
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE status = 'done') * 100.0) / COUNT(*))
  END
  FROM tasks 
  WHERE project_id = projects.id AND is_active = true
);

-- Mark completed tasks
UPDATE tasks 
SET completed_at = updated_at 
WHERE status = 'done' AND completed_at IS NULL;

-- Deactivate expired invitations
UPDATE user_invitations 
SET expires_at = created_at 
WHERE expires_at < NOW() AND accepted_at IS NULL;

-- Log data migration completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('migrate_data', 'All data migrated successfully with transformations and cleanup');