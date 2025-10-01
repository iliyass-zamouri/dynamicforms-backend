-- Migration: Add lifetime plan support to account types and subscriptions
-- Date: 2025-01-15

-- Add lifetime pricing and billing model to account_types
ALTER TABLE account_types 
ADD COLUMN price_lifetime DECIMAL(10,2) NULL AFTER price_yearly,
ADD COLUMN billing_model ENUM('recurring', 'lifetime') DEFAULT 'recurring' AFTER price_lifetime;

-- Add plan type to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN plan_type ENUM('recurring', 'lifetime') DEFAULT 'recurring' AFTER account_type_id;

-- Update existing subscriptions to have plan_type = 'recurring'
UPDATE subscriptions 
SET plan_type = 'recurring' 
WHERE plan_type IS NULL;

-- Create indexes for better performance
CREATE INDEX idx_account_types_billing_model ON account_types(billing_model);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
