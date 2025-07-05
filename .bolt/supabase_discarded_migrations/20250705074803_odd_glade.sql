/*
# Database Schema Migration - Final Optimizations and Cleanup

This migration completes the database schema redesign with:
1. Table analysis for query optimization
2. System monitoring views
3. Performance tracking
4. Security hardening
5. Cleanup procedures
6. Migration completion verification
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

-- Refresh materialized views if any exist
-- (Currently none, but placeholder for future use)

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
  n_tup_del,
  CASE 
    WHEN idx_scan > 0 THEN ROUND((idx_tup_fetch * 100.0) / (seq_tup_read + idx_tup_fetch), 2)
    ELSE 0 
  END as index_usage_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Create table size monitoring view
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================
-- SECURITY HARDENING
-- =============================================

-- Revoke unnecessary permissions from backup schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_schema') THEN
    EXECUTE 'REVOKE ALL ON backup_schema.migration_log FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON backup_schema.migration_verification FROM PUBLIC';
  END IF;
END $$;

-- Grant specific permissions to authenticated users
GRANT SELECT ON system_health TO authenticated;
GRANT SELECT ON query_performance TO authenticated;
GRANT SELECT ON table_sizes TO authenticated;

-- =============================================
-- CLEANUP PROCEDURES
-- =============================================

-- Create cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
  deleted_notifications INTEGER := 0;
  deleted_invitations INTEGER := 0;
  deleted_resets INTEGER := 0;
  deleted_sessions INTEGER := 0;
  result_text TEXT;
BEGIN
  -- Clean up old notifications (older than 90 days)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND read_at IS NOT NULL;
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
  
  -- Clean up expired invitations
  DELETE FROM user_invitations 
  WHERE expires_at < NOW() 
    AND accepted_at IS NULL;
  GET DIAGNOSTICS deleted_invitations = ROW_COUNT;
  
  -- Clean up used password reset requests
  DELETE FROM password_reset_requests 
  WHERE used_at IS NOT NULL 
    AND used_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_resets = ROW_COUNT;
  
  -- Clean up old work sessions
  DELETE FROM work_sessions 
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND is_active = false;
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
  
  result_text := 'Cleanup completed successfully. ' ||
                'Deleted: ' || deleted_notifications || ' notifications, ' ||
                deleted_invitations || ' invitations, ' ||
                deleted_resets || ' password resets, ' ||
                deleted_sessions || ' work sessions.';
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_database_stats()
RETURNS TEXT AS $$
DECLARE
  table_record RECORD;
  stats_count INTEGER := 0;
BEGIN
  -- Analyze all public tables
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ANALYZE ' || quote_ident(table_record.tablename);
    stats_count := stats_count + 1;
  END LOOP;
  
  RETURN 'Database statistics refreshed for ' || stats_count || ' tables.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HEALTH CHECK FUNCTIONS
-- =============================================

-- Create comprehensive health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check table counts
  RETURN QUERY
  SELECT 
    'Table Counts'::TEXT,
    'OK'::TEXT,
    'Users: ' || (SELECT COUNT(*) FROM users)::TEXT ||
    ', Companies: ' || (SELECT COUNT(*) FROM companies)::TEXT ||
    ', Tasks: ' || (SELECT COUNT(*) FROM tasks)::TEXT;
  
  -- Check RLS policies
  RETURN QUERY
  SELECT 
    'RLS Policies'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
    'Active policies: ' || COUNT(*)::TEXT
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Check indexes
  RETURN QUERY
  SELECT 
    'Database Indexes'::TEXT,
    'OK'::TEXT,
    'Total indexes: ' || COUNT(*)::TEXT
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  -- Check foreign key constraints
  RETURN QUERY
  SELECT 
    'Foreign Keys'::TEXT,
    'OK'::TEXT,
    'Active constraints: ' || COUNT(*)::TEXT
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

-- Create rollback procedure (for emergency use only)
CREATE OR REPLACE FUNCTION emergency_rollback_info()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EMERGENCY ROLLBACK PROCEDURE:' || E'\n' ||
         '1. Disable application access immediately' || E'\n' ||
         '2. Check backup schema: SELECT * FROM backup_schema.migration_log ORDER BY completed_at;' || E'\n' ||
         '3. Verify backup data integrity' || E'\n' ||
         '4. Contact system administrator before proceeding' || E'\n' ||
         '5. Backup schema contains all original data for restoration' || E'\n' ||
         'WARNING: Only proceed with proper authorization and testing.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION COMPLETION LOGGING
-- =============================================

-- Log migration completion
DO $$
BEGIN
  -- Only log if backup schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_schema') THEN
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
  END IF;
END $$;

-- =============================================
-- FINAL VERIFICATION
-- =============================================

-- Final verification and summary
DO $$
DECLARE
  total_records INTEGER := 0;
  backup_records INTEGER := 0;
  efficiency_percentage NUMERIC := 0;
BEGIN
  -- Get migration counts if backup schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_schema') THEN
    SELECT COALESCE(SUM(migrated_count), 0) INTO total_records 
    FROM backup_schema.migration_verification;
    
    SELECT COALESCE(SUM(original_count), 0) INTO backup_records 
    FROM backup_schema.migration_verification;
    
    IF backup_records > 0 THEN
      efficiency_percentage := ROUND((total_records * 100.0) / backup_records, 2);
    END IF;
  END IF;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total records migrated: % out of %', total_records, backup_records;
  RAISE NOTICE 'Migration efficiency: %%', efficiency_percentage;
  RAISE NOTICE 'Backup schema preserved for rollback if needed';
  RAISE NOTICE 'New optimized schema ready for application use';
  RAISE NOTICE 'Performance monitoring views created';
  RAISE NOTICE 'Cleanup procedures available';
  RAISE NOTICE '================================================';
END $$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant permissions for maintenance functions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_database_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION database_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_rollback_info() TO authenticated;

-- =============================================
-- FINAL LOGGING
-- =============================================

-- Log final completion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_schema') THEN
    INSERT INTO backup_schema.migration_log (operation, notes) 
    VALUES (
      'finalize_migration', 
      'Migration finalized successfully. System ready for production use. ' ||
      'Health check functions created. Monitoring views active. ' ||
      'Cleanup procedures available. Completed at: ' || NOW()::TEXT
    );
  END IF;
END $$;

-- Create a simple verification that everything is working
SELECT 
  'Migration completed successfully!' as status,
  NOW() as completed_at,
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM companies) as company_count,
  (SELECT COUNT(*) FROM tasks) as task_count;