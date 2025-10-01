-- Migration to add email verification code fields
-- Description: Adds email verification code and expiration fields to users table

-- Add email_verification_code column (6-digit verification code, NULL if no verification requested)
ALTER TABLE users ADD COLUMN email_verification_code VARCHAR(6) NULL;

-- Add email_verification_code_expires_at column (expiration timestamp for verification code, NULL if no verification requested)
ALTER TABLE users ADD COLUMN email_verification_code_expires_at TIMESTAMP NULL;

-- Add indexes for better query performance
CREATE INDEX idx_users_email_verification_code ON users(email_verification_code);
CREATE INDEX idx_users_email_verification_code_expires_at ON users(email_verification_code_expires_at);
