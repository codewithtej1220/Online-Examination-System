-- Migration 004: Phase 2 - Enhanced Exam Experience
-- Purpose: Add columns and tables for exam timer, bookmarks, calculator, practice mode, auto-save

-- Add columns to examination table
ALTER TABLE examination 
ADD COLUMN calculator_enabled BOOLEAN DEFAULT FALSE AFTER duration_minutes,
ADD COLUMN is_practice BOOLEAN DEFAULT FALSE AFTER calculator_enabled,
ADD COLUMN practice_attempts_allowed INT DEFAULT -1 AFTER is_practice COMMENT '-1 means unlimited',
ADD COLUMN auto_submit_on_timeout BOOLEAN DEFAULT TRUE AFTER practice_attempts_allowed,
ADD COLUMN show_timer_warnings BOOLEAN DEFAULT TRUE AFTER auto_submit_on_timeout;

-- Add columns to exam_attempt table
ALTER TABLE exam_attempt
ADD COLUMN bookmarked_questions JSON DEFAULT NULL AFTER score COMMENT 'Array of question IDs',
ADD COLUMN time_extended_seconds INT DEFAULT 0 AFTER bookmarked_questions,
ADD COLUMN time_extension_reason VARCHAR(500) DEFAULT NULL AFTER time_extended_seconds,
ADD COLUMN auto_submitted BOOLEAN DEFAULT FALSE AFTER time_extension_reason,
ADD COLUMN answers_draft JSON DEFAULT NULL AFTER auto_submitted COMMENT 'Auto-save draft data';

-- Create answer_drafts table for auto-save
CREATE TABLE IF NOT EXISTS answer_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    draft_answer JSON NOT NULL COMMENT 'Selected option or answer text',
    is_synced BOOLEAN DEFAULT FALSE COMMENT 'Whether synced to student_answer table',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_question (question_id),
    INDEX idx_synced (is_synced),
    UNIQUE KEY unique_draft (attempt_id, question_id),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(question_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create practice_attempts table for practice mode tracking
CREATE TABLE IF NOT EXISTS practice_attempts (
    practice_attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    attempt_number INT NOT NULL,
    score DECIMAL(5,2) DEFAULT NULL,
    total_questions INT DEFAULT NULL,
    correct_answers INT DEFAULT NULL,
    time_taken_seconds INT DEFAULT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    answers JSON DEFAULT NULL COMMENT 'Array of {question_id, selected_option, is_correct}',
    
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_student_exam (student_user_id, exam_id),
    INDEX idx_completed (completed_at),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create exam_analytics table for performance tracking
CREATE TABLE IF NOT EXISTS exam_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    attempt_id INT DEFAULT NULL,
    total_practice_attempts INT DEFAULT 0,
    average_practice_score DECIMAL(5,2) DEFAULT NULL,
    best_practice_score DECIMAL(5,2) DEFAULT NULL,
    actual_exam_score DECIMAL(5,2) DEFAULT NULL,
    improvement_percentage DECIMAL(5,2) DEFAULT NULL COMMENT 'Improvement from first practice to actual',
    weak_topics JSON DEFAULT NULL COMMENT 'Array of {topic, correct_rate}',
    strong_topics JSON DEFAULT NULL,
    time_management_score DECIMAL(5,2) DEFAULT NULL COMMENT '0-100 based on time usage patterns',
    completion_rate DECIMAL(5,2) DEFAULT NULL COMMENT 'Percentage of questions answered',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_attempt (attempt_id),
    UNIQUE KEY unique_student_exam (student_user_id, exam_id),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create time_extensions table for tracking time extensions
CREATE TABLE IF NOT EXISTS time_extensions (
    extension_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    faculty_user_id INT NOT NULL COMMENT 'Who granted the extension',
    extension_seconds INT NOT NULL,
    reason VARCHAR(500) DEFAULT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_faculty (faculty_user_id),
    
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES examination(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempt(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing exams to have default settings
UPDATE examination 
SET calculator_enabled = FALSE,
    is_practice = FALSE,
    practice_attempts_allowed = -1,
    auto_submit_on_timeout = TRUE,
    show_timer_warnings = TRUE
WHERE calculator_enabled IS NULL;

COMMIT;
