-- Migration to add user management fields
-- Description: Adds blocked_at and email_verified_at columns to users table for admin user management

-- Add blocked_at column (timestamp when user was blocked, NULL if not blocked)
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL;

-- Add email_verified_at column (timestamp when email was verified, NULL if not verified)
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;

-- Add indexes for better query performance
CREATE INDEX idx_users_blocked_at ON users(blocked_at);
CREATE INDEX idx_users_email_verified_at ON users(email_verified_at);
