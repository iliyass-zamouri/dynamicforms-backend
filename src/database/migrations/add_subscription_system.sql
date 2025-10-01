-- Migration: Add subscription system tables
-- Description: Adds comprehensive subscription management with history tracking

-- Subscriptions table - tracks current active subscriptions
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    account_type_id VARCHAR(36) NOT NULL,
    
    -- Subscription details
    status ENUM('active', 'inactive', 'cancelled', 'expired', 'suspended', 'pending') DEFAULT 'pending',
    billing_cycle ENUM('monthly', 'yearly') NOT NULL,
    
    -- Pricing and billing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Dates
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    
    -- Payment integration fields (for future payment system)
    payment_provider VARCHAR(50), -- 'stripe', 'paypal', 'manual', etc.
    payment_provider_subscription_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    
    -- Trial information
    trial_start_date TIMESTAMP NULL,
    trial_end_date TIMESTAMP NULL,
    is_trial BOOLEAN DEFAULT FALSE,
    
    -- Auto-renewal settings
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_type_id) REFERENCES account_types(id) ON DELETE RESTRICT,
    
    INDEX idx_user_id (user_id),
    INDEX idx_account_type_id (account_type_id),
    INDEX idx_status (status),
    INDEX idx_billing_cycle (billing_cycle),
    INDEX idx_next_billing_date (next_billing_date),
    INDEX idx_payment_provider (payment_provider),
    UNIQUE KEY unique_active_user_subscription (user_id, status) -- Only one active subscription per user
);

-- Subscription history table - tracks all subscription changes
CREATE TABLE subscription_history (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Change details
    action ENUM('created', 'activated', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'expired', 'suspended', 'reactivated', 'payment_failed', 'payment_succeeded') NOT NULL,
    
    -- Previous and new values
    previous_account_type_id VARCHAR(36),
    new_account_type_id VARCHAR(36),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    previous_amount DECIMAL(10,2),
    new_amount DECIMAL(10,2),
    previous_billing_cycle VARCHAR(20),
    new_billing_cycle VARCHAR(20),
    
    -- Change reason and metadata
    reason VARCHAR(255),
    metadata JSON,
    
    -- System information
    changed_by VARCHAR(36), -- user_id who made the change (NULL for system changes)
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_account_type_id) REFERENCES account_types(id) ON DELETE SET NULL,
    FOREIGN KEY (new_account_type_id) REFERENCES account_types(id) ON DELETE SET NULL,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Subscription limits tracking table - tracks usage against subscription limits
CREATE TABLE subscription_usage (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Usage tracking
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Current usage counts
    forms_created INT DEFAULT 0,
    submissions_received INT DEFAULT 0,
    exports_performed INT DEFAULT 0,
    
    -- Limits from account type (snapshot at time of usage)
    max_forms INT NOT NULL,
    max_submissions_per_form INT NOT NULL,
    max_exports_per_form INT NOT NULL,
    
    -- Status
    is_over_limit BOOLEAN DEFAULT FALSE,
    over_limit_details JSON, -- Details about which limits were exceeded
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_user_id (user_id),
    INDEX idx_period (period_start, period_end),
    INDEX idx_is_over_limit (is_over_limit),
    UNIQUE KEY unique_subscription_period (subscription_id, period_start, period_end)
);

-- Subscription notifications table - tracks subscription-related notifications
CREATE TABLE subscription_notifications (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Notification details
    type ENUM('trial_ending', 'payment_due', 'payment_failed', 'subscription_expired', 'limit_reached', 'upgrade_available', 'downgrade_warning') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery status
    status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
    delivery_method ENUM('email', 'in_app', 'sms') DEFAULT 'email',
    
    -- Scheduling
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    
    -- Metadata
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_scheduled_for (scheduled_for)
);

-- Update user_preferences table to reference subscriptions
ALTER TABLE user_preferences 
ADD COLUMN subscription_id VARCHAR(36) NULL,
ADD FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
ADD INDEX idx_subscription_id (subscription_id);

-- Add currency symbol to account_types table if not exists
ALTER TABLE account_types 
ADD COLUMN currency_symbol VARCHAR(5) DEFAULT '$' AFTER currency;

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_status_billing ON subscriptions(status, billing_cycle);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date, status);
CREATE INDEX idx_subscription_history_user_action ON subscription_history(user_id, action);
CREATE INDEX idx_subscription_usage_period_user ON subscription_usage(user_id, period_start, period_end);
