/*
  # Database Schema Backup
  
  This file creates a complete backup of the current database schema
  before performing the redesign migration.
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_schema;

-- Backup all existing tables with data
CREATE TABLE backup_schema.users AS SELECT * FROM public.users;
CREATE TABLE backup_schema.companies AS SELECT * FROM public.companies;
CREATE TABLE backup_schema.company_users AS SELECT * FROM public.company_users;
CREATE TABLE backup_schema.teams AS SELECT * FROM public.teams;
CREATE TABLE backup_schema.user_teams AS SELECT * FROM public.user_teams;
CREATE TABLE backup_schema.tags AS SELECT * FROM public.tags;
CREATE TABLE backup_schema.tag_responses AS SELECT * FROM public.tag_responses;
CREATE TABLE backup_schema.time_entries AS SELECT * FROM public.time_entries;
CREATE TABLE backup_schema.work_sessions AS SELECT * FROM public.work_sessions;
CREATE TABLE backup_schema.user_invitations AS SELECT * FROM public.user_invitations;
CREATE TABLE backup_schema.projects AS SELECT * FROM public.projects;
CREATE TABLE backup_schema.project_members AS SELECT * FROM public.project_members;
CREATE TABLE backup_schema.milestones AS SELECT * FROM public.milestones;
CREATE TABLE backup_schema.notifications AS SELECT * FROM public.notifications;
CREATE TABLE backup_schema.notification_preferences AS SELECT * FROM public.notification_preferences;
CREATE TABLE backup_schema.template_categories AS SELECT * FROM public.template_categories;
CREATE TABLE backup_schema.task_templates AS SELECT * FROM public.task_templates;
CREATE TABLE backup_schema.password_reset_requests AS SELECT * FROM public.password_reset_requests;

-- Backup functions and policies (as comments for reference)
/*
EXISTING FUNCTIONS:
- has_company_role(uuid, uuid, text[])
- is_company_member(uuid, uuid)
- request_password_reset(uuid, uuid)
- generate_temporary_password(uuid, uuid, text)
- update_company_updated_at()
- update_tag_updated_at()
- update_milestone_progress()
*/

-- Create backup completion log
CREATE TABLE backup_schema.migration_log (
  id SERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('schema_backup', 'Complete backup of existing schema created');