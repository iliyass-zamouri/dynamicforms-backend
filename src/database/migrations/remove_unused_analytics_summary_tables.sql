-- Remove Unused Analytics Summary Tables Migration
-- This migration removes the unused summary tables that were never populated or used

-- Drop the unused summary tables
DROP TABLE IF EXISTS form_field_analytics_summary;
DROP TABLE IF EXISTS form_step_analytics_summary;
DROP TABLE IF EXISTS form_analytics_summary;

-- Note: The views form_analytics_overview and form_step_analytics_overview
-- remain as they provide the necessary aggregated analytics data
