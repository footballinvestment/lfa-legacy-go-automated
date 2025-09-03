-- Enhanced password security migration
-- NIST 2024 compliance and security improvements

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_breach_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Performance indexes for security queries
CREATE INDEX IF NOT EXISTS idx_users_account_locks ON users(account_locked_until) 
WHERE account_locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) 
WHERE mfa_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) 
WHERE failed_login_attempts > 0;

-- Update existing users to have password_updated_at set to created_at if null
UPDATE users 
SET password_updated_at = COALESCE(password_updated_at, created_at)
WHERE password_updated_at IS NULL;