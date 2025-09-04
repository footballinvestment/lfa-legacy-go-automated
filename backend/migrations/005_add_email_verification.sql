-- Migration 005: Add email verification fields
-- Created: 2025-09-03
-- Purpose: Add email verification and security fields to users table

BEGIN;

-- Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP NULL;

-- Add email change security fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_requested BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_new_email VARCHAR(255) NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_change_token ON users(email_change_token) WHERE email_change_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.email_verification_sent_at IS 'When verification email was sent';
COMMENT ON COLUMN users.email_change_requested IS 'User requested email change';
COMMENT ON COLUMN users.email_change_token IS 'Token for email change verification';
COMMENT ON COLUMN users.email_change_new_email IS 'New email address to change to';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 005 completed: Email verification fields added successfully';
END $$;

COMMIT;