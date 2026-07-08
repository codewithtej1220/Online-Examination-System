-- ========================================
-- AI Integration Schema Updates
-- ========================================
-- Updates question_bank to support AI-generated Essay and Fill-in-the-blank questions

USE online_exam_system;

-- Alter question_type ENUM to include new types
ALTER TABLE question_bank 
MODIFY COLUMN question_type ENUM('MCQ', 'Essay', 'FillInBlank') NOT NULL DEFAULT 'MCQ';

-- Add index for faster filtering by question type
CREATE INDEX idx_question_type_ai ON question_bank(question_type);

-- Optional: Add AI metadata columns (for tracking which questions were AI-generated)
ALTER TABLE question_bank 
ADD COLUMN ai_generated TINYINT(1) DEFAULT 0 AFTER tags,
ADD COLUMN ai_confidence_score DECIMAL(5,2) DEFAULT NULL AFTER ai_generated;

-- Create table for storing syllabus uploads and AI generation history
CREATE TABLE IF NOT EXISTS ai_generation_history (
    generation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    faculty_user_id BIGINT NOT NULL,
    syllabus_filename VARCHAR(255) NOT NULL,
    syllabus_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    requested_count INT NOT NULL,
    generated_count INT NOT NULL,
    difficulty_level VARCHAR(50),
    subject_topic VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_generation_faculty (faculty_user_id),
    CONSTRAINT fk_generation_faculty FOREIGN KEY (faculty_user_id) 
        REFERENCES faculty(user_id) ON DELETE CASCADE
);

-- Create table for essay evaluation history
CREATE TABLE IF NOT EXISTS essay_evaluations (
    evaluation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    answer_id BIGINT NOT NULL,
    ai_score DECIMAL(6,2) NOT NULL,
    ai_feedback TEXT,
    faculty_override TINYINT(1) DEFAULT 0,
    final_score DECIMAL(6,2),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evaluation_answer (answer_id),
    CONSTRAINT fk_evaluation_answer FOREIGN KEY (answer_id) 
        REFERENCES student_answers(answer_id) ON DELETE CASCADE
);

-- Add comment to document schema version
ALTER TABLE question_bank COMMENT = 'Question bank supporting MCQ, Essay, and Fill-in-blank types with AI generation support';

SELECT 'AI Integration schema updates completed successfully!' AS status;
