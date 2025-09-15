-- Migration: Add sidebar_is_active column to marketing_settings table
-- Date: 2025-01-14

-- Add the sidebar_is_active column to marketing_settings table
ALTER TABLE marketing_settings 
ADD COLUMN sidebar_is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to have sidebar_is_active = true by default
UPDATE marketing_settings 
SET sidebar_is_active = TRUE 
WHERE sidebar_is_active IS NULL;
