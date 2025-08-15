-- Migration: Add moderation tables for user violations and admin logs
-- Created: 2025-08-12
-- Phase 3: Administration & Management

-- Create user_violations table
CREATE TABLE user_violations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL CHECK (type IN ('warning', 'suspension', 'inappropriate_conduct', 'cheating', 'harassment', 'spam', 'terms_violation', 'other')),
  reason TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed'))
);

-- Create moderation_logs table
CREATE TABLE moderation_logs (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id),
  target_user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_reports table for managing user-submitted reports
CREATE TABLE user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  reported_user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')),
  assigned_to INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_violations_user_id ON user_violations(user_id);
CREATE INDEX idx_user_violations_created_by ON user_violations(created_by);
CREATE INDEX idx_user_violations_status ON user_violations(status);
CREATE INDEX idx_user_violations_type ON user_violations(type);
CREATE INDEX idx_user_violations_created_at ON user_violations(created_at DESC);

CREATE INDEX idx_moderation_logs_actor_id ON moderation_logs(actor_id);
CREATE INDEX idx_moderation_logs_target_user_id ON moderation_logs(target_user_id);
CREATE INDEX idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

CREATE INDEX idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user_id ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_assigned_to ON user_reports(assigned_to);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at DESC);

-- Add updated_at trigger for user_violations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_violations_updated_at 
  BEFORE UPDATE ON user_violations 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at 
  BEFORE UPDATE ON user_reports 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample admin user if not exists (for testing)
INSERT INTO users (id, username, email, password_hash, full_name, user_type, is_active, created_at)
VALUES (1, 'admin', 'admin@lfagolegacy.com', '$2b$12$dummy_hash_for_admin', 'System Admin', 'admin', true, now())
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for testing
INSERT INTO user_violations (user_id, type, reason, notes, created_by) VALUES
  (2, 'warning', 'Inappropriate language in chat', 'User was warned about using offensive language during tournament match', 1),
  (3, 'harassment', 'Harassing other players', 'Multiple reports of toxic behavior towards other participants', 1),
  (4, 'cheating', 'Suspected use of external tools', 'Unusual game patterns detected, investigation required', 1)
ON CONFLICT DO NOTHING;