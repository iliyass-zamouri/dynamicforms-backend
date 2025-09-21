-- Migration: Add Gemini conversations table
-- Description: Table pour sauvegarder les conversations entre utilisateurs et Gemini AI

CREATE TABLE IF NOT EXISTS gemini_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    conversation_type ENUM('generate', 'modify', 'analyze', 'chat') NOT NULL,
    form_id VARCHAR(36) NULL,
    user_message TEXT NOT NULL,
    gemini_response TEXT NOT NULL,
    prompt_used TEXT NOT NULL,
    response_metadata JSON NULL,
    tokens_used INT DEFAULT 0,
    processing_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_conversation_type (conversation_type),
    INDEX idx_form_id (form_id),
    INDEX idx_created_at (created_at)
);

-- Table pour les sessions de conversation
CREATE TABLE IF NOT EXISTS gemini_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);
