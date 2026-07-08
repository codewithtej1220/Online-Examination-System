-- Database Performance Optimization - Add Indexes
-- Run this after creating the initial schema
-- Note: Indexes will only be created if they don't already exist

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Faculty table indexes
CREATE INDEX idx_faculty_department ON faculty(department);

-- Student table indexes
CREATE INDEX idx_student_semester ON student(current_semester);

-- Question bank indexes
CREATE INDEX idx_question_faculty ON question_bank(faculty_user_id);
CREATE INDEX idx_question_type ON question_bank(question_type);
CREATE INDEX idx_question_difficulty ON question_bank(difficulty_level);
CREATE INDEX idx_question_subject ON question_bank(subject_topic);

-- Examination indexes
CREATE INDEX idx_exam_faculty ON examination(faculty_user_id);
CREATE INDEX idx_exam_scheduled ON examination(scheduled_time);
CREATE INDEX idx_exam_created ON examination(created_at);

-- Exam questions indexes (composite for better lookup)
CREATE INDEX idx_exam_questions_lookup ON exam_questions(exam_id, question_id);

-- Student exam indexes (composite for better lookup)
CREATE INDEX idx_student_exam_lookup ON student_exam(student_user_id, exam_id);
CREATE INDEX idx_student_exam_student ON student_exam(student_user_id);
CREATE INDEX idx_student_exam_exam ON student_exam(exam_id);

-- Attempt indexes
CREATE INDEX idx_attempt_student ON attempt(student_user_id);
CREATE INDEX idx_attempt_exam ON attempt(exam_id);
CREATE INDEX idx_attempt_status ON attempt(status);
CREATE INDEX idx_attempt_created ON attempt(created_at);
CREATE INDEX idx_attempt_student_exam ON attempt(student_user_id, exam_id);

-- Student answers indexes
CREATE INDEX idx_answer_attempt ON student_answers(attempt_id);
CREATE INDEX idx_answer_question ON student_answers(question_id);
CREATE INDEX idx_answer_correct ON student_answers(is_correct);

-- Result indexes
CREATE INDEX idx_result_attempt ON result(attempt_id);
CREATE INDEX idx_result_exam ON result(exam_id);
CREATE INDEX idx_result_published ON result(is_published);
CREATE INDEX idx_result_submitted ON result(submitted_at);

-- Admin table index
CREATE INDEX idx_admin_email ON admin(email);
