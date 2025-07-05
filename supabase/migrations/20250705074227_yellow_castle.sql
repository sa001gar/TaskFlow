/*
  # Create Optimized Indexes
  
  This migration creates all necessary indexes for optimal query performance
  based on common access patterns in the application.
*/

-- =============================================
-- PRIMARY ENTITY INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Companies indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Company memberships indexes
CREATE INDEX idx_company_memberships_user_id ON company_memberships(user_id);
CREATE INDEX idx_company_memberships_company_id ON company_memberships(company_id);
CREATE INDEX idx_company_memberships_role ON company_memberships(role);
CREATE INDEX idx_company_memberships_is_active ON company_memberships(is_active);
CREATE INDEX idx_company_memberships_joined_at ON company_memberships(joined_at);
CREATE INDEX idx_company_memberships_user_company_active ON company_memberships(user_id, company_id, is_active);

-- Teams indexes
CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Team memberships indexes
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_role ON team_memberships(role);
CREATE INDEX idx_team_memberships_is_active ON team_memberships(is_active);
CREATE INDEX idx_team_memberships_user_team_active ON team_memberships(user_id, team_id, is_active);

-- =============================================
-- PROJECT AND TASK INDEXES
-- =============================================

-- Projects indexes
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_is_active ON projects(is_active);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Tasks indexes (most critical for performance)
CREATE INDEX idx_tasks_company_id ON tasks(company_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_is_active ON tasks(is_active);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_team_status ON tasks(team_id, status);
CREATE INDEX idx_tasks_due_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;

-- GIN indexes for array and JSONB columns
CREATE INDEX idx_tasks_tags_gin ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_custom_fields_gin ON tasks USING GIN(custom_fields);

-- =============================================
-- ACTIVITY AND TRACKING INDEXES
-- =============================================

-- Task activities indexes
CREATE INDEX idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX idx_task_activities_user_id ON task_activities(user_id);
CREATE INDEX idx_task_activities_type ON task_activities(activity_type);
CREATE INDEX idx_task_activities_created_at ON task_activities(created_at);
CREATE INDEX idx_task_activities_task_created ON task_activities(task_id, created_at);

-- Time entries indexes
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_is_billable ON time_entries(is_billable);
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX idx_time_entries_task_date ON time_entries(task_id, entry_date);

-- Work sessions indexes
CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_task_id ON work_sessions(task_id);
CREATE INDEX idx_work_sessions_is_active ON work_sessions(is_active);
CREATE INDEX idx_work_sessions_started_at ON work_sessions(started_at);

-- =============================================
-- NOTIFICATION INDEXES
-- =============================================

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- =============================================
-- ADMIN AND TEMPLATE INDEXES
-- =============================================

-- Task templates indexes
CREATE INDEX idx_task_templates_company_id ON task_templates(company_id);
CREATE INDEX idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX idx_task_templates_is_public ON task_templates(is_public);

-- User invitations indexes
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_company_id ON user_invitations(company_id);
CREATE INDEX idx_user_invitations_team_id ON user_invitations(team_id);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX idx_user_invitations_accepted_at ON user_invitations(accepted_at);

-- Password reset requests indexes
CREATE INDEX idx_password_reset_user_id ON password_reset_requests(user_id);
CREATE INDEX idx_password_reset_company_id ON password_reset_requests(company_id);
CREATE INDEX idx_password_reset_token ON password_reset_requests(token);
CREATE INDEX idx_password_reset_expires_at ON password_reset_requests(expires_at);
CREATE INDEX idx_password_reset_used_at ON password_reset_requests(used_at);

-- Log index creation completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('create_indexes', 'All optimized indexes created successfully');