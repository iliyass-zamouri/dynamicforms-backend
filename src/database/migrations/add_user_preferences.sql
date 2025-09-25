-- Migration: Add user preferences table
-- Description: Adds user preferences for account types, limits, and export permissions

-- User preferences table
CREATE TABLE user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    account_type ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    
    -- Form limits
    max_forms INT DEFAULT 5,
    max_submissions_per_form INT DEFAULT 100,
    
    -- Export permissions and limits
    can_export_forms BOOLEAN DEFAULT FALSE,
    can_export_submissions BOOLEAN DEFAULT FALSE,
    max_exports_per_form INT DEFAULT 0,
    max_exports_per_submission INT DEFAULT 0,
    
    -- Additional preferences (JSON for extensibility)
    additional_preferences JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id),
    INDEX idx_account_type (account_type),
    INDEX idx_user_id (user_id)
);

-- Insert default preferences for existing users
INSERT INTO user_preferences (id, user_id, account_type, max_forms, max_submissions_per_form, can_export_forms, can_export_submissions, max_exports_per_form, max_exports_per_submission)
SELECT 
    UUID() as id,
    u.id as user_id,
    CASE 
        WHEN u.role = 'admin' THEN 'enterprise'
        ELSE 'free'
    END as account_type,
    CASE 
        WHEN u.role = 'admin' THEN 999999
        ELSE 5
    END as max_forms,
    CASE 
        WHEN u.role = 'admin' THEN 999999
        ELSE 100
    END as max_submissions_per_form,
    CASE 
        WHEN u.role = 'admin' THEN TRUE
        ELSE FALSE
    END as can_export_forms,
    CASE 
        WHEN u.role = 'admin' THEN TRUE
        ELSE FALSE
    END as can_export_submissions,
    CASE 
        WHEN u.role = 'admin' THEN 999999
        ELSE 0
    END as max_exports_per_form,
    CASE 
        WHEN u.role = 'admin' THEN 999999
        ELSE 0
    END as max_exports_per_submission
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = u.id
);

-- Export tracking table
CREATE TABLE export_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    form_id VARCHAR(36),
    submission_id VARCHAR(36),
    export_type ENUM('form', 'submission') NOT NULL,
    export_format ENUM('json', 'csv', 'xlsx', 'pdf') NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_form_id (form_id),
    INDEX idx_submission_id (submission_id),
    INDEX idx_export_type (export_type),
    INDEX idx_created_at (created_at)
);
