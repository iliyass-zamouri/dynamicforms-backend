-- Add email verification fields to users table
-- This migration adds email verification functionality

ALTER TABLE users 
ADD COLUMN email_verification_token VARCHAR(255) NULL,
ADD COLUMN email_verified_at TIMESTAMP NULL,
ADD COLUMN blocked_at TIMESTAMP NULL;

-- Add indexes for better performance
CREATE INDEX idx_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_email_verified_at ON users(email_verified_at);
CREATE INDEX idx_blocked_at ON users(blocked_at);
