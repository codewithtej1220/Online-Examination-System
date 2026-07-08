-- Phase 3: Faculty Advanced Tools Schema

-- Add columns to question table
ALTER TABLE question ADD COLUMN tags JSON DEFAULT NULL;
ALTER TABLE question ADD COLUMN version INT DEFAULT 1;
ALTER TABLE question ADD COLUMN parent_question_id BIGINT DEFAULT NULL;
ALTER TABLE question ADD COLUMN quality_score DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE question ADD COLUMN usage_count INT DEFAULT 0;
ALTER TABLE question ADD COLUMN avg_correct_rate DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE question ADD COLUMN created_by_user_id BIGINT DEFAULT NULL;
ALTER TABLE question ADD COLUMN last_modified_by BIGINT DEFAULT NULL;
ALTER TABLE question ADD COLUMN last_modified_at DATETIME DEFAULT NULL;

-- Question templates table
CREATE TABLE IF NOT EXISTS question_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL,
    category VARCHAR(100),
    created_by_user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_creator (created_by_user_id)
);

-- Question collaborators table
CREATE TABLE IF NOT EXISTS question_collaborators (
    collab_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    faculty_user_id BIGINT NOT NULL,
    permission ENUM('view','edit','owner') DEFAULT 'view',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_collab (question_id, faculty_user_id),
    INDEX idx_question (question_id),
    INDEX idx_faculty (faculty_user_id)
);

-- Question ratings table
CREATE TABLE IF NOT EXISTS question_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    faculty_user_id BIGINT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    rated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rating (question_id, faculty_user_id),
    INDEX idx_question (question_id),
    INDEX idx_faculty (faculty_user_id)
);

COMMIT;
