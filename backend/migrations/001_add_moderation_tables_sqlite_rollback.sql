-- Rollback: Remove moderation tables (SQLite)
-- Migration: 001_add_moderation_tables_sqlite.sql
-- Created: 2025-08-12
-- Phase 3: Administration & Management

-- Drop triggers first (SQLite syntax)
DROP TRIGGER IF EXISTS update_user_violations_updated_at;
DROP TRIGGER IF EXISTS update_user_reports_updated_at;

-- Drop indexes (SQLite)
DROP INDEX IF EXISTS idx_user_violations_user_id;
DROP INDEX IF EXISTS idx_user_violations_created_by;
DROP INDEX IF EXISTS idx_user_violations_status;
DROP INDEX IF EXISTS idx_user_violations_type;
DROP INDEX IF EXISTS idx_user_violations_created_at;

DROP INDEX IF EXISTS idx_moderation_logs_actor_id;
DROP INDEX IF EXISTS idx_moderation_logs_target_user_id;
DROP INDEX IF EXISTS idx_moderation_logs_action;
DROP INDEX IF EXISTS idx_moderation_logs_created_at;

DROP INDEX IF EXISTS idx_user_reports_reporter_id;
DROP INDEX IF EXISTS idx_user_reports_reported_user_id;
DROP INDEX IF EXISTS idx_user_reports_status;
DROP INDEX IF EXISTS idx_user_reports_assigned_to;
DROP INDEX IF EXISTS idx_user_reports_created_at;

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS user_reports;
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS user_violations;

-- Note: In SQLite, we don't need CASCADE as it doesn't support it
-- Foreign key constraints are handled automatically when tables are dropped