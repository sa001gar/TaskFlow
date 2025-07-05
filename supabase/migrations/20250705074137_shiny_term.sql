/*
  # Drop Existing Schema
  
  This migration safely drops all existing tables, functions, and policies
  in the correct order to handle dependencies.
*/

-- Disable RLS temporarily to avoid policy conflicts
SET session_replication_role = replica;

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop all functions
DROP FUNCTION IF EXISTS has_company_role(uuid, uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS is_company_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_team_leader(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS request_password_reset(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS generate_temporary_password(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS update_company_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_tag_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_milestone_progress() CASCADE;

-- Drop tables in dependency order (children first, parents last)
DROP TABLE IF EXISTS password_reset_requests CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS work_sessions CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS tag_responses CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_teams CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS company_users CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Log completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('drop_schema', 'All existing tables, functions, and policies dropped');