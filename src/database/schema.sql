-- Dynamic Forms Database Schema
-- MySQL Database Schema for Dynamic Forms Application

CREATE DATABASE IF NOT EXISTS dynamic_forms;
USE dynamic_forms;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Forms table
CREATE TABLE forms (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive', 'draft') DEFAULT 'draft',
    allow_multiple_submissions BOOLEAN DEFAULT TRUE,
    require_authentication BOOLEAN DEFAULT FALSE,
    theme VARCHAR(50) DEFAULT 'default',
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    notification_email VARCHAR(255),
    email_notifications BOOLEAN DEFAULT TRUE,
    success_modal JSON,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Form steps table
CREATE TABLE form_steps (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    step_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_step_order (step_order)
);

-- Form fields table
CREATE TABLE form_fields (
    id VARCHAR(36) PRIMARY KEY,
    step_id VARCHAR(36) NOT NULL,
    field_type ENUM('text', 'email', 'password', 'number', 'tel', 'url', 'textarea', 'select', 'radio', 'checkbox', 'file', 'date', 'time', 'datetime-local') NOT NULL,
    label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    field_order INT NOT NULL,
    validation_config JSON,
    file_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (step_id) REFERENCES form_steps(id) ON DELETE CASCADE,
    INDEX idx_step_id (step_id),
    INDEX idx_field_type (field_type),
    INDEX idx_field_order (field_order)
);

-- Field options table (for select, radio, checkbox fields)
CREATE TABLE field_options (
    id VARCHAR(36) PRIMARY KEY,
    field_id VARCHAR(36) NOT NULL,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    option_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    INDEX idx_field_id (field_id),
    INDEX idx_option_order (option_order)
);

-- Form submissions table
CREATE TABLE form_submissions (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    submission_data JSON NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_submitted_at (submitted_at)
);

-- Marketing settings table
CREATE TABLE marketing_settings (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    sidebar_title VARCHAR(255),
    sidebar_description TEXT,
    sidebar_logo VARCHAR(500),
    footer_text TEXT,
    social_media_enabled BOOLEAN DEFAULT FALSE,
    social_media_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_form_marketing (form_id)
);

-- Social media buttons table
CREATE TABLE social_media_buttons (
    id VARCHAR(36) PRIMARY KEY,
    marketing_id VARCHAR(36) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(100),
    is_enabled BOOLEAN DEFAULT TRUE,
    button_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (marketing_id) REFERENCES marketing_settings(id) ON DELETE CASCADE,
    INDEX idx_marketing_id (marketing_id),
    INDEX idx_button_order (button_order)
);

-- File uploads table
CREATE TABLE file_uploads (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    field_id VARCHAR(36) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id),
    INDEX idx_field_id (field_id)
);

-- Create indexes for better performance
CREATE INDEX idx_forms_created_at ON forms(created_at);
CREATE INDEX idx_forms_updated_at ON forms(updated_at);
CREATE INDEX idx_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX idx_submissions_form_submitted ON form_submissions(form_id, submitted_at);
