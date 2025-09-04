-- Migration 004: Add MFA (Multi-Factor Authentication) fields
-- Phase 3: Complete MFA implementation with TOTP and WebAuthn support

-- Add MFA-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMP;

-- Add indexes for MFA fields for performance
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_mfa_method ON users(mfa_method) WHERE mfa_method IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.mfa_method IS 'MFA method: totp or webauthn';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret key for authenticator apps';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Array of backup codes for account recovery';
COMMENT ON COLUMN users.mfa_enabled_at IS 'Timestamp when MFA was first enabled';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 004 completed: MFA fields added successfully';
END $$;