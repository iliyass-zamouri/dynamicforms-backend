-- Form Analytics Tracking System Migration
-- This migration adds comprehensive tracking capabilities for form analytics

-- Form visits tracking table
CREATE TABLE form_visits (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    country VARCHAR(2),
    city VARCHAR(100),
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
    browser VARCHAR(100),
    os VARCHAR(100),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_visited_at (visited_at),
    INDEX idx_form_visited_at (form_id, visited_at),
    INDEX idx_device_type (device_type)
);

-- Form step tracking table (tracks time spent on each step)
CREATE TABLE form_step_tracking (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    step_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    step_order INT NOT NULL,
    time_spent_ms INT DEFAULT 0,
    field_interactions INT DEFAULT 0,
    validation_errors INT DEFAULT 0,
    step_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    step_completed_at TIMESTAMP NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES form_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_step_id (step_id),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_step_started_at (step_started_at)
);

-- Form field interactions tracking table
CREATE TABLE form_field_interactions (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    step_id VARCHAR(36) NOT NULL,
    field_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    interaction_type ENUM('focus', 'blur', 'input', 'validation_error', 'validation_success') NOT NULL,
    field_value_length INT DEFAULT 0,
    time_spent_ms INT DEFAULT 0,
    interaction_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES form_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_step_id (step_id),
    INDEX idx_field_id (field_id),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_created_at (created_at)
);

-- Form submission sessions table (tracks complete submission journey)
CREATE TABLE form_submission_sessions (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(36) NOT NULL,
    submission_id VARCHAR(36) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    country VARCHAR(2),
    city VARCHAR(100),
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
    browser VARCHAR(100),
    os VARCHAR(100),
    total_time_spent_ms INT DEFAULT 0,
    total_steps_completed INT DEFAULT 0,
    total_field_interactions INT DEFAULT 0,
    total_validation_errors INT DEFAULT 0,
    session_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_completed_at TIMESTAMP NULL,
    submission_completed BOOLEAN DEFAULT FALSE,
    abandoned_at_step INT NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_submission_id (submission_id),
    INDEX idx_session_started_at (session_started_at),
    INDEX idx_submission_completed (submission_completed),
    INDEX idx_device_type (device_type)
);

-- Form analytics aggregated data table (for performance optimization)
CREATE TABLE form_analytics_summary (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    total_visits INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    total_sessions INT DEFAULT 0,
    completed_sessions INT DEFAULT 0,
    abandoned_sessions INT DEFAULT 0,
    average_session_duration_ms INT DEFAULT 0,
    average_steps_completed DECIMAL(5,2) DEFAULT 0,
    average_field_interactions INT DEFAULT 0,
    average_validation_errors INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    desktop_visits INT DEFAULT 0,
    mobile_visits INT DEFAULT 0,
    tablet_visits INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_form_date (form_id, date),
    INDEX idx_form_id (form_id),
    INDEX idx_date (date),
    INDEX idx_form_date (form_id, date)
);

-- Form step analytics aggregated data table
CREATE TABLE form_step_analytics_summary (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    step_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    step_order INT NOT NULL,
    total_visits INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    average_time_spent_ms INT DEFAULT 0,
    average_field_interactions INT DEFAULT 0,
    average_validation_errors INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    abandonment_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES form_steps(id) ON DELETE CASCADE,
    UNIQUE KEY unique_form_step_date (form_id, step_id, date),
    INDEX idx_form_id (form_id),
    INDEX idx_step_id (step_id),
    INDEX idx_date (date),
    INDEX idx_form_step_date (form_id, step_id, date)
);

-- Form field analytics aggregated data table
CREATE TABLE form_field_analytics_summary (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    step_id VARCHAR(36) NOT NULL,
    field_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    total_interactions INT DEFAULT 0,
    unique_interactors INT DEFAULT 0,
    average_time_spent_ms INT DEFAULT 0,
    average_value_length INT DEFAULT 0,
    validation_error_rate DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES form_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    UNIQUE KEY unique_form_field_date (form_id, field_id, date),
    INDEX idx_form_id (form_id),
    INDEX idx_step_id (step_id),
    INDEX idx_field_id (field_id),
    INDEX idx_date (date),
    INDEX idx_field_type (field_type),
    INDEX idx_form_field_date (form_id, field_id, date)
);

-- Create indexes for better performance on analytics queries
CREATE INDEX idx_form_visits_form_date ON form_visits(form_id, visited_at);
CREATE INDEX idx_form_step_tracking_form_session ON form_step_tracking(form_id, session_id);
CREATE INDEX idx_form_field_interactions_form_session ON form_field_interactions(form_id, session_id);
CREATE INDEX idx_form_submission_sessions_form_date ON form_submission_sessions(form_id, session_started_at);

-- Create views for common analytics queries
CREATE VIEW form_analytics_overview AS
SELECT 
    f.id as form_id,
    f.title as form_title,
    f.slug as form_slug,
    COUNT(DISTINCT fv.id) as total_visits,
    COUNT(DISTINCT fv.user_id) as unique_logged_users,
    COUNT(DISTINCT fv.session_id) as unique_sessions,
    COUNT(DISTINCT CASE WHEN fss.submission_completed = TRUE THEN fss.id END) as completed_submissions,
    COUNT(DISTINCT CASE WHEN fss.submission_completed = FALSE THEN fss.id END) as abandoned_sessions,
    AVG(fss.total_time_spent_ms) as avg_session_duration_ms,
    AVG(fss.total_steps_completed) as avg_steps_completed,
    AVG(fss.total_field_interactions) as avg_field_interactions,
    AVG(fss.total_validation_errors) as avg_validation_errors,
    CASE 
        WHEN COUNT(DISTINCT fss.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN fss.submission_completed = TRUE THEN fss.id END) * 100.0 / COUNT(DISTINCT fss.id))
        ELSE 0 
    END as conversion_rate
FROM forms f
LEFT JOIN form_visits fv ON f.id = fv.form_id
LEFT JOIN form_submission_sessions fss ON f.id = fss.form_id
GROUP BY f.id, f.title, f.slug;

CREATE VIEW form_step_analytics_overview AS
SELECT 
    f.id as form_id,
    f.title as form_title,
    fs.id as step_id,
    fs.title as step_title,
    fs.step_order,
    COUNT(DISTINCT fst.id) as total_step_visits,
    COUNT(DISTINCT fst.user_id) as unique_logged_users,
    COUNT(DISTINCT fst.session_id) as unique_sessions,
    AVG(fst.time_spent_ms) as avg_time_spent_ms,
    AVG(fst.field_interactions) as avg_field_interactions,
    AVG(fst.validation_errors) as avg_validation_errors,
    COUNT(DISTINCT CASE WHEN fst.step_completed_at IS NOT NULL THEN fst.id END) as completed_steps,
    CASE 
        WHEN COUNT(DISTINCT fst.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN fst.step_completed_at IS NOT NULL THEN fst.id END) * 100.0 / COUNT(DISTINCT fst.id))
        ELSE 0 
    END as step_completion_rate
FROM forms f
JOIN form_steps fs ON f.id = fs.form_id
LEFT JOIN form_step_tracking fst ON fs.id = fst.step_id
GROUP BY f.id, f.title, fs.id, fs.title, fs.step_order;
