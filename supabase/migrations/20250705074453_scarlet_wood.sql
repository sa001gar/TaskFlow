/*
  # Verify Migration
  
  This migration verifies data integrity and creates summary reports
  of the migration process.
*/

-- =============================================
-- DATA INTEGRITY CHECKS
-- =============================================

-- Create verification results table
CREATE TABLE IF NOT EXISTS backup_schema.migration_verification (
  check_name TEXT PRIMARY KEY,
  original_count INTEGER,
  migrated_count INTEGER,
  success_rate DECIMAL(5,2),
  notes TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify users migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'users',
  (SELECT COUNT(*) FROM backup_schema.users),
  (SELECT COUNT(*) FROM users),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.users) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM users) * 100.0 / (SELECT COUNT(*) FROM backup_schema.users), 2)
  END,
  'User profiles migrated'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify companies migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'companies',
  (SELECT COUNT(*) FROM backup_schema.companies),
  (SELECT COUNT(*) FROM companies),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.companies) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM companies) * 100.0 / (SELECT COUNT(*) FROM backup_schema.companies), 2)
  END,
  'Companies migrated with slug generation'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify company memberships migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'company_memberships',
  (SELECT COUNT(*) FROM backup_schema.company_users),
  (SELECT COUNT(*) FROM company_memberships),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.company_users) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM company_memberships) * 100.0 / (SELECT COUNT(*) FROM backup_schema.company_users), 2)
  END,
  'Company memberships migrated with role mapping'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify teams migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'teams',
  (SELECT COUNT(*) FROM backup_schema.teams),
  (SELECT COUNT(*) FROM teams),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.teams) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM teams) * 100.0 / (SELECT COUNT(*) FROM backup_schema.teams), 2)
  END,
  'Teams migrated with creator assignment'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify team memberships migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'team_memberships',
  (SELECT COUNT(*) FROM backup_schema.user_teams),
  (SELECT COUNT(*) FROM team_memberships),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.user_teams) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM team_memberships) * 100.0 / (SELECT COUNT(*) FROM backup_schema.user_teams), 2)
  END,
  'Team memberships migrated with role mapping'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify projects migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'projects',
  (SELECT COUNT(*) FROM backup_schema.projects),
  (SELECT COUNT(*) FROM projects),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.projects) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM projects) * 100.0 / (SELECT COUNT(*) FROM backup_schema.projects), 2)
  END,
  'Projects migrated with status/priority mapping'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify tasks migration (most important)
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'tasks',
  (SELECT COUNT(*) FROM backup_schema.tags),
  (SELECT COUNT(*) FROM tasks),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.tags) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM tasks) * 100.0 / (SELECT COUNT(*) FROM backup_schema.tags), 2)
  END,
  'Tasks migrated from tags table with comprehensive mapping'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify task activities migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'task_activities',
  (SELECT COUNT(*) FROM backup_schema.tag_responses),
  (SELECT COUNT(*) FROM task_activities),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.tag_responses) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM task_activities) * 100.0 / (SELECT COUNT(*) FROM backup_schema.tag_responses), 2)
  END,
  'Task activities migrated from tag_responses'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Verify time entries migration
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'time_entries',
  (SELECT COUNT(*) FROM backup_schema.time_entries),
  (SELECT COUNT(*) FROM time_entries),
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_schema.time_entries) = 0 THEN 100.0
    ELSE ROUND((SELECT COUNT(*) FROM time_entries) * 100.0 / (SELECT COUNT(*) FROM backup_schema.time_entries), 2)
  END,
  'Time entries migrated with billable flag mapping'
ON CONFLICT (check_name) DO UPDATE SET
  original_count = EXCLUDED.original_count,
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- =============================================
-- REFERENTIAL INTEGRITY CHECKS
-- =============================================

-- Check for orphaned records
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'orphaned_tasks',
  0,
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN 100.0 ELSE 0.0 END,
  'Tasks without valid company_id: ' || COUNT(*)::TEXT
FROM tasks 
WHERE company_id NOT IN (SELECT id FROM companies)
ON CONFLICT (check_name) DO UPDATE SET
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Check for invalid assignments
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'invalid_assignments',
  0,
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN 100.0 ELSE 0.0 END,
  'Tasks assigned to non-existent users: ' || COUNT(*)::TEXT
FROM tasks 
WHERE assigned_to IS NOT NULL 
  AND assigned_to NOT IN (SELECT id FROM users)
ON CONFLICT (check_name) DO UPDATE SET
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- Check for missing team memberships
INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
SELECT 
  'missing_team_memberships',
  0,
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN 100.0 ELSE 0.0 END,
  'Tasks assigned to teams where user is not a member: ' || COUNT(*)::TEXT
FROM tasks t
WHERE t.team_id IS NOT NULL 
  AND t.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.team_id = t.team_id 
      AND tm.user_id = t.assigned_to 
      AND tm.is_active = true
  )
ON CONFLICT (check_name) DO UPDATE SET
  migrated_count = EXCLUDED.migrated_count,
  success_rate = EXCLUDED.success_rate,
  notes = EXCLUDED.notes,
  checked_at = NOW();

-- =============================================
-- PERFORMANCE VERIFICATION
-- =============================================

-- Test common queries for performance
DO $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  duration INTERVAL;
BEGIN
  -- Test user dashboard query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM tasks t
  JOIN company_memberships cm ON t.company_id = cm.company_id
  WHERE cm.user_id = (SELECT id FROM users LIMIT 1)
    AND cm.is_active = true
    AND t.is_active = true;
  end_time := clock_timestamp();
  duration := end_time - start_time;
  
  INSERT INTO backup_schema.migration_verification (check_name, original_count, migrated_count, success_rate, notes)
  VALUES ('dashboard_query_performance', 0, 0, 100.0, 'Dashboard query took: ' || duration::TEXT)
  ON CONFLICT (check_name) DO UPDATE SET
    notes = EXCLUDED.notes,
    checked_at = NOW();
END $$;

-- =============================================
-- MIGRATION SUMMARY REPORT
-- =============================================

-- Create final migration report
INSERT INTO backup_schema.migration_log (operation, notes)
SELECT 
  'migration_summary',
  'Migration completed. Success rates: ' || 
  STRING_AGG(check_name || ': ' || success_rate::TEXT || '%', ', ' ORDER BY check_name)
FROM backup_schema.migration_verification;

-- Log verification completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('verify_migration', 'Migration verification completed successfully');

-- Display verification results
SELECT 
  check_name,
  original_count,
  migrated_count,
  success_rate || '%' as success_rate,
  notes,
  checked_at
FROM backup_schema.migration_verification
ORDER BY check_name;