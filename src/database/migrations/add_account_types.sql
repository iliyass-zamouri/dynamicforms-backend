-- Migration: Add account types table
-- Description: Adds account types table to store default values for each account type

-- Account types table
CREATE TABLE account_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Form limits
    max_forms INT DEFAULT 5,
    max_submissions_per_form INT DEFAULT 100,
    
    -- Export permissions and limits
    can_export_forms BOOLEAN DEFAULT FALSE,
    can_export_submissions BOOLEAN DEFAULT FALSE,
    max_exports_per_form INT DEFAULT 0,
    max_exports_per_submission INT DEFAULT 0,
    
    -- Additional features (JSON for extensibility)
    features JSON,
    
    -- Pricing and billing
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_yearly DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default)
);

-- Insert default account types
INSERT INTO account_types (
    id, name, display_name, description, max_forms, max_submissions_per_form,
    can_export_forms, can_export_submissions, max_exports_per_form, max_exports_per_submission,
    features, price_monthly, price_yearly, currency, is_active, is_default
) VALUES 
(
    UUID(), 'free', 'Free Plan', 'Basic plan with limited features', 
    1, 20, FALSE, FALSE, 0, 0,
    JSON_OBJECT('support', 'community', 'analytics', false, 'custom_domains', 0),
    0.00, 0.00, 'USD', TRUE, TRUE
),
(
    UUID(), 'basic', 'Basic Plan', 'Entry-level paid plan with essential features',
    5, 100, TRUE, TRUE, 10, 10,
    JSON_OBJECT('support', 'email', 'analytics', true, 'custom_domains', 1),
    9.99, 99.99, 'USD', TRUE, FALSE
),
(
    UUID(), 'pro', 'Pro Plan', 'Advanced plan with professional features',
    25, 1000, TRUE, TRUE, 50, 50,
    JSON_OBJECT('support', 'priority', 'analytics', true, 'custom_domains', 3, 'api_access', true),
    29.99, 299.99, 'USD', TRUE, FALSE
),
(
    UUID(), 'enterprise', 'Enterprise Plan', 'Full-featured plan for large organizations',
    999999, 999999, TRUE, TRUE, 999999, 999999,
    JSON_OBJECT('support', 'dedicated', 'analytics', true, 'custom_domains', 999999, 'api_access', true, 'sso', true, 'white_label', true),
    99.99, 999.99, 'USD', TRUE, FALSE
);
