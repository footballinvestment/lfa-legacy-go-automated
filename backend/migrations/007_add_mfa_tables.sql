-- Migration 007: Add MFA Factors Table for proper MFA management
-- Creates separate table for MFA factors instead of storing directly in users table

-- Create MFA Factors table
CREATE TABLE IF NOT EXISTS user_mfa_factors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    factor_type VARCHAR(50) NOT NULL CHECK (factor_type IN ('totp', 'webauthn', 'backup_codes')),
    secret_key VARCHAR(255),
    public_key TEXT,
    credential_id VARCHAR(255),
    backup_codes JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    UNIQUE(user_id, factor_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_factors_user ON user_mfa_factors(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mfa_factors_type ON user_mfa_factors(factor_type) WHERE is_active = TRUE;

-- Add comments for documentation
COMMENT ON TABLE user_mfa_factors IS 'MFA factors for users (TOTP, WebAuthn, backup codes)';
COMMENT ON COLUMN user_mfa_factors.factor_type IS 'Type of MFA factor: totp, webauthn, or backup_codes';
COMMENT ON COLUMN user_mfa_factors.secret_key IS 'TOTP secret key for authenticator apps';
COMMENT ON COLUMN user_mfa_factors.public_key IS 'WebAuthn public key for security keys/biometrics';
COMMENT ON COLUMN user_mfa_factors.credential_id IS 'WebAuthn credential ID';
COMMENT ON COLUMN user_mfa_factors.backup_codes IS 'JSON array of backup recovery codes';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 007 completed: MFA factors table created successfully';
END $$;