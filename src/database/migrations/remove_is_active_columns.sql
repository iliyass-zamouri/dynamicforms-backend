-- Migration: Remove is_active and sidebar_is_active columns
-- Date: 2025-01-14

-- Remove the is_active column from forms table
ALTER TABLE forms 
DROP COLUMN is_active;

-- Remove the sidebar_is_active column from marketing_settings table
ALTER TABLE marketing_settings 
DROP COLUMN sidebar_is_active;
