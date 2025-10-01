-- Migration: Create migration tracking table
-- Description: Creates a table to track which migrations have been applied

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
    id VARCHAR(36) PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    migration_file VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(255) DEFAULT 'system',
    checksum VARCHAR(64), -- Optional: for file integrity verification
    execution_time_ms INT, -- Track how long migration took
    status ENUM('success', 'failed', 'partial') DEFAULT 'success',
    error_message TEXT NULL,
    
    INDEX idx_migration_name (migration_name),
    INDEX idx_applied_at (applied_at),
    INDEX idx_status (status)
);

-- Insert initial migration record for schema creation
INSERT IGNORE INTO migration_history (
    id, migration_name, migration_file, applied_by, status
) VALUES (
    UUID(), 'initial_schema', 'schema.sql', 'system', 'success'
);
