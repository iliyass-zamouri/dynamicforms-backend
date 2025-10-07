-- Migration: Add payment transactions table
-- Description: Comprehensive payment transaction tracking for audit, reconciliation, and history
-- Date: 2025-10-07

CREATE TABLE payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Subscription relationship
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Payment provider details
    payment_provider ENUM('stripe', 'paypal', 'manual', 'other') NOT NULL,
    provider_transaction_id VARCHAR(255), -- Stripe charge ID, PayPal transaction ID, etc.
    provider_invoice_id VARCHAR(255), -- Stripe invoice ID
    provider_subscription_id VARCHAR(255), -- External subscription ID
    provider_customer_id VARCHAR(255), -- External customer ID
    
    -- Transaction details
    transaction_type ENUM('payment', 'refund', 'chargeback', 'adjustment', 'credit') DEFAULT 'payment',
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'disputed') NOT NULL,
    
    -- Financial details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    fee_amount DECIMAL(10,2) DEFAULT 0.00, -- Processing fees
    net_amount DECIMAL(10,2), -- Amount after fees
    
    -- Payment method
    payment_method_type VARCHAR(50), -- 'card', 'bank_transfer', 'paypal', etc.
    payment_method_id VARCHAR(255), -- Stripe payment method ID
    last_four VARCHAR(4), -- Last 4 digits of card
    card_brand VARCHAR(50), -- 'visa', 'mastercard', etc.
    
    -- Billing details
    billing_reason VARCHAR(100), -- 'subscription_create', 'subscription_cycle', 'subscription_update', etc.
    billing_period_start TIMESTAMP NULL,
    billing_period_end TIMESTAMP NULL,
    
    -- Dates
    transaction_date TIMESTAMP NOT NULL,
    settled_date TIMESTAMP NULL,
    
    -- Webhook and event tracking
    webhook_event_id VARCHAR(255), -- Stripe event ID for idempotency
    webhook_received_at TIMESTAMP NULL,
    webhook_processed_at TIMESTAMP NULL,
    
    -- Error handling
    failure_code VARCHAR(100),
    failure_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Metadata and additional info
    description TEXT,
    receipt_url VARCHAR(500),
    invoice_url VARCHAR(500),
    metadata JSON,
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_provider (payment_provider),
    INDEX idx_provider_transaction_id (provider_transaction_id),
    INDEX idx_provider_invoice_id (provider_invoice_id),
    INDEX idx_provider_subscription_id (provider_subscription_id),
    INDEX idx_status (status),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_webhook_event_id (webhook_event_id),
    
    -- Unique constraint for idempotency
    UNIQUE KEY unique_webhook_event (webhook_event_id, provider_transaction_id)
);

-- Create composite indexes for common queries
CREATE INDEX idx_user_status_date ON payment_transactions(user_id, status, transaction_date);
CREATE INDEX idx_subscription_status ON payment_transactions(subscription_id, status);
CREATE INDEX idx_provider_status ON payment_transactions(payment_provider, status, transaction_date);

