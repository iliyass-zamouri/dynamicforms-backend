-- Migration to add password reset fields
-- Description: Adds password reset token and expiration fields to users table

-- Add password_reset_token column (token for password reset, NULL if no reset requested)
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;

-- Add password_reset_expires_at column (expiration timestamp for reset token, NULL if no reset requested)
ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP NULL;

-- Add email_verification_token column (token for email verification, NULL if verified or no verification needed)
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;

-- Add indexes for better query performance
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_password_reset_expires_at ON users(password_reset_expires_at);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
