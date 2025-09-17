-- Migration: Add sidebar_enabled field to marketing_settings table
-- This migration adds a boolean field to control whether the sidebar is enabled

ALTER TABLE marketing_settings 
ADD COLUMN sidebar_enabled BOOLEAN DEFAULT TRUE AFTER sidebar_logo;
