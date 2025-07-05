/*
  # Create Triggers
  
  This migration creates all necessary triggers for automatic
  data management and audit trails.
*/

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

-- Users table
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Companies table
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Company memberships table
CREATE TRIGGER trigger_company_memberships_updated_at
  BEFORE UPDATE ON company_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Teams table
CREATE TRIGGER trigger_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Projects table
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tasks table
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Time entries table
CREATE TRIGGER trigger_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Task templates table
CREATE TRIGGER trigger_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification preferences table
CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BUSINESS LOGIC TRIGGERS
-- =============================================

-- Task activity logging
CREATE TRIGGER trigger_task_activity_log
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_activity();

-- Work session duration calculation
CREATE TRIGGER trigger_work_session_duration
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- =============================================
-- DATA VALIDATION TRIGGERS
-- =============================================

-- Ensure only one active work session per user
CREATE OR REPLACE FUNCTION validate_active_work_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate any other active sessions for this user
    UPDATE work_sessions 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_active_work_session
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_active_work_session();

-- Update task actual hours when time entries change
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id UUID;
  v_total_hours DECIMAL(5,2);
BEGIN
  -- Determine which task to update
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;
  
  -- Calculate total hours for the task
  SELECT COALESCE(SUM(hours_logged), 0) INTO v_total_hours
  FROM time_entries
  WHERE task_id = v_task_id;
  
  -- Update task actual hours
  UPDATE tasks 
  SET actual_hours = v_total_hours,
      updated_at = NOW()
  WHERE id = v_task_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_actual_hours
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_task_actual_hours();

-- Auto-complete tasks when all subtasks are done
CREATE OR REPLACE FUNCTION check_parent_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_incomplete_count INTEGER;
BEGIN
  -- Only process when a task is marked as done
  IF NEW.status = 'done' AND NEW.parent_task_id IS NOT NULL THEN
    v_parent_id := NEW.parent_task_id;
    
    -- Count incomplete subtasks
    SELECT COUNT(*) INTO v_incomplete_count
    FROM tasks
    WHERE parent_task_id = v_parent_id
      AND status != 'done'
      AND is_active = true;
    
    -- If no incomplete subtasks, mark parent as done
    IF v_incomplete_count = 0 THEN
      UPDATE tasks
      SET status = 'done',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_parent_id
        AND status != 'done';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_parent_task_completion
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_parent_task_completion();

-- Log trigger creation completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('create_triggers', 'All triggers created successfully');