-- Migration to add order attribute to form fields
-- This migration ensures that all existing fields have a proper order value

-- Update existing fields to have order based on their current field_order
UPDATE form_fields 
SET field_order = field_order 
WHERE field_order IS NOT NULL;

-- If there are any fields with NULL field_order, set them to 0
UPDATE form_fields 
SET field_order = 0 
WHERE field_order IS NULL;

-- Add index for better performance when ordering fields
CREATE INDEX idx_form_fields_order ON form_fields(step_id, field_order);
