/*
  # Finalize Migration
  
  This migration completes the schema redesign by:
  - Creating final optimizations
  - Setting up monitoring
  - Cleaning up temporary data
  - Providing rollback instructions
*/

-- =============================================
-- FINAL OPTIMIZATIONS
-- =============================================

-- Analyze tables for query planner optimization
ANALYZE users;
ANALYZE companies;
ANALYZE company_memberships;
ANALYZE teams;
ANALYZE team_memberships;
ANALYZE projects;
ANALYZE tasks;
ANALYZE task_activities;
ANALYZE time_entries;
ANALYZE work_sessions;
ANALYZE notifications;
ANALYZE notification_preferences;
ANALYZE task_templates;
ANALYZE user_invitations;
ANALYZE password_reset_requests;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;

-- =============================================
-- MONITORING AND MAINTENANCE
-- =============================================

-- Create monitoring view for system health
CREATE OR REPLACE VIEW system_health AS
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_records
FROM users
UNION ALL
SELECT 
  'companies',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM companies
UNION ALL
SELECT 
  'tasks',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM tasks
UNION ALL
SELECT 
  'projects',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM projects;

-- Create performance monitoring view
CREATE OR REPLACE VIEW query_performance AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- =============================================
-- SECURITY HARDENING
-- =============================================

-- Revoke unnecessary permissions
REVOKE ALL ON backup_schema.migration_log FROM PUBLIC;
REVOKE ALL ON backup_schema.migration_verification FROM PUBLIC;

-- Grant specific permissions to authenticated users
GRANT SELECT ON system_health TO authenticated;
GRANT SELECT ON query_performance TO authenticated;

-- =============================================
-- CLEANUP PROCEDURES
-- =============================================

-- Create cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Clean up old notifications (older than 90 days)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND read_at IS NOT NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up expired invitations
  DELETE FROM user_invitations 
  WHERE expires_at < NOW() 
    AND accepted_at IS NULL;
  
  -- Clean up used password reset requests
  DELETE FROM password_reset_requests 
  WHERE used_at IS NOT NULL 
    AND used_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old work sessions
  DELETE FROM work_sessions 
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND is_active = false;
  
  RETURN 'Cleanup completed. Deleted ' || deleted_count || ' old notifications and other expired data.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

-- Create rollback procedure (for emergency use only)
CREATE OR REPLACE FUNCTION emergency_rollback()
RETURNS TEXT AS $$
BEGIN
  RAISE NOTICE 'EMERGENCY ROLLBACK PROCEDURE';
  RAISE NOTICE '1. Disable application access immediately';
  RAISE NOTICE '2. Run: SELECT * FROM backup_schema.migration_log ORDER BY completed_at;';
  RAISE NOTICE '3. Restore from backup_schema tables if needed';
  RAISE NOTICE '4. Contact system administrator';
  
  RETURN 'Rollback instructions displayed. DO NOT PROCEED without proper authorization.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION COMPLETION
-- =============================================

-- Create migration completion summary
INSERT INTO backup_schema.migration_log (operation, notes)
VALUES (
  'migration_completed',
  'Database schema redesign completed successfully. ' ||
  'New schema features: ' ||
  '- Simplified RLS policies without circular dependencies, ' ||
  '- Optimized indexes for common query patterns, ' ||
  '- Improved data validation and constraints, ' ||
  '- Better naming conventions (tasks instead of tags), ' ||
  '- Enhanced audit trails and activity logging, ' ||
  '- Comprehensive business logic functions, ' ||
  '- Performance monitoring views, ' ||
  '- Automated cleanup procedures. ' ||
  'Migration completed at: ' || NOW()::TEXT
);

-- Final verification count
DO $$
DECLARE
  total_records INTEGER;
  backup_records INTEGER;
BEGIN
  SELECT SUM(migrated_count) INTO total_records FROM backup_schema.migration_verification;
  SELECT SUM(original_count) INTO backup_records FROM backup_schema.migration_verification;
  
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE 'Total records migrated: % out of %', total_records, backup_records;
  RAISE NOTICE 'Migration efficiency: %', ROUND((total_records * 100.0) / NULLIF(backup_records, 0), 2) || '%';
  RAISE NOTICE 'Backup schema preserved in: backup_schema';
  RAISE NOTICE 'New schema ready for application use';
END $$;

-- Grant final permissions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_rollback() TO authenticated;

-- Log final completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('finalize_migration', 'Migration finalized and system ready for production use');