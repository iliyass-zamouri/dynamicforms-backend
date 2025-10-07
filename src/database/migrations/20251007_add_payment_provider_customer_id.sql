-- Migration: Add payment_provider_customer_id to subscriptions table
-- Description: Adds field to store external payment provider customer ID (e.g., Stripe customer ID)
-- Date: 2025-10-07

ALTER TABLE subscriptions 
ADD COLUMN payment_provider_customer_id VARCHAR(255) NULL AFTER payment_provider_subscription_id,
ADD INDEX idx_payment_provider_customer_id (payment_provider_customer_id);

