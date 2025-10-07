-- Migration: Add 'pro' to user_preferences.account_type ENUM
-- Description: Adds 'pro' plan to the account_type ENUM to match account_types table
-- Date: 2025-10-07

ALTER TABLE user_preferences 
MODIFY COLUMN account_type ENUM('free','basic','pro','premium','enterprise') DEFAULT 'free';

