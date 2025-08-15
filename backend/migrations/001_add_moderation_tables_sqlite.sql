-- Migration: Add moderation tables for user violations and admin logs (SQLite)
-- Created: 2025-08-12
-- Phase 3: Administration & Management

-- Create user_violations table
CREATE TABLE user_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warning', 'suspension', 'inappropriate_conduct', 'cheating', 'harassment', 'spam', 'terms_violation', 'other')),
  reason TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create moderation_logs table
CREATE TABLE moderation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  target_user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

-- Create user_reports table for managing user-submitted reports
CREATE TABLE user_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  reported_user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')),
  assigned_to INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_violations_user_id ON user_violations(user_id);
CREATE INDEX idx_user_violations_created_by ON user_violations(created_by);
CREATE INDEX idx_user_violations_status ON user_violations(status);
CREATE INDEX idx_user_violations_type ON user_violations(type);
CREATE INDEX idx_user_violations_created_at ON user_violations(created_at);

CREATE INDEX idx_moderation_logs_actor_id ON moderation_logs(actor_id);
CREATE INDEX idx_moderation_logs_target_user_id ON moderation_logs(target_user_id);
CREATE INDEX idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at);

CREATE INDEX idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user_id ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_assigned_to ON user_reports(assigned_to);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at);

-- Create triggers for updating updated_at column (SQLite compatible)
CREATE TRIGGER update_user_violations_updated_at 
  AFTER UPDATE ON user_violations 
  FOR EACH ROW 
  BEGIN
    UPDATE user_violations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER update_user_reports_updated_at 
  AFTER UPDATE ON user_reports 
  FOR EACH ROW 
  BEGIN
    UPDATE user_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Insert sample admin user if not exists (for testing)
INSERT OR IGNORE INTO users (id, username, email, hashed_password, full_name, user_type, is_active, created_at)
VALUES (1, 'admin', 'admin@lfagolegacy.com', '$2b$12$dummy_hash_for_admin', 'System Admin', 'admin', 1, CURRENT_TIMESTAMP);

-- Insert sample data for testing (only if tables have data)
INSERT INTO user_violations (user_id, type, reason, notes, created_by) 
SELECT 2, 'warning', 'Inappropriate language in chat', 'User was warned about using offensive language during tournament match', 1
WHERE EXISTS (SELECT 1 FROM users WHERE id = 2);

INSERT INTO user_violations (user_id, type, reason, notes, created_by) 
SELECT 3, 'harassment', 'Harassing other players', 'Multiple reports of toxic behavior towards other participants', 1
WHERE EXISTS (SELECT 1 FROM users WHERE id = 3);

INSERT INTO user_violations (user_id, type, reason, notes, created_by) 
SELECT 4, 'cheating', 'Suspected use of external tools', 'Unusual game patterns detected, investigation required', 1
WHERE EXISTS (SELECT 1 FROM users WHERE id = 4);