-- Quick Sample Data Population for Dashboard Testing
-- Run this to add sample data for the dashboard

-- First, get user IDs (assuming some users exist)
-- We'll use IDs from recent registrations

-- Add sample faculty user if needed
INSERT IGNORE INTO users (username, password_hash, role) 
VALUES ('prof_demo', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYRqKe4vJ2u', 'faculty');

SET @faculty_id = (SELECT user_id FROM users WHERE role='faculty' LIMIT 1);

INSERT IGNORE INTO faculty (user_id, department) 
VALUES (@faculty_id, 'Computer Science');

-- Add sample questions
INSERT INTO question_bank (faculty_user_id, content, question_type, difficulty_level, correct_answer, option_a, option_b, option_c, option_d, subject_topic)
VALUES 
(@faculty_id, 'What is the primary key in a database?', 'MCQ', 'EASY', 'A', 
'A unique identifier for a record', 'A foreign key reference', 'An index column', 'A nullable column', 'Database Fundamentals'),

(@faculty_id, 'Which SQL command is used to retrieve data?', 'MCQ', 'EASY', 'B', 
'INSERT', 'SELECT', 'UPDATE', 'DELETE', 'SQL Basics'),

(@faculty_id, 'What does ACID stand for in databases?', 'MCQ', 'MEDIUM', 'C', 
'Access, Consistency, Integrity, Durability', 'Atomicity, Consistency, Independence, Durability', 
'Atomicity, Consistency, Isolation, Durability', 'Access, Control, Isolation, Data', 'Transaction Management'),

(@faculty_id, 'Which normal form eliminates transitive dependencies?', 'MCQ', 'HARD', 'D', 
'1NF', '2NF', '4NF', '3NF', 'Normalization'),

(@faculty_id, 'What is a foreign key constraint?', 'MCQ', 'MEDIUM', 'A', 
'Ensures referential integrity between tables', 'Creates an index', 'Makes column unique', 'Defines default value', 'Constraints');

-- Add sample exams
INSERT INTO exam (title, duration_minutes, scheduled_time, faculty_user_id, randomize_questions)
VALUES 
('Database Fundamentals Quiz', 30, DATE_ADD(NOW(), INTERVAL 7 DAY), @faculty_id, 0),
('SQL Basics Test', 45, DATE_ADD(NOW(), INTERVAL 14 DAY), @faculty_id, 1),
('Advanced DBMS Final', 90, DATE_ADD(NOW(), INTERVAL 21 DAY), @faculty_id, 0);

-- Link questions to first exam
SET @exam1_id = (SELECT exam_id FROM exam WHERE title='Database Fundamentals Quiz' LIMIT 1);
SET @exam2_id = (SELECT exam_id FROM exam WHERE title='SQL Basics Test' LIMIT 1);
SET @exam3_id = (SELECT exam_id FROM exam WHERE title='Advanced DBMS Final' LIMIT 1);

-- Get question IDs
SET @q1 = (SELECT question_id FROM question_bank WHERE content LIKE '%primary key%' LIMIT 1);
SET @q2 = (SELECT question_id FROM question_bank WHERE content LIKE '%SQL command%' LIMIT 1);
SET @q3 = (SELECT question_id FROM question_bank WHERE content LIKE '%ACID%' LIMIT 1);
SET @q4 = (SELECT question_id FROM question_bank WHERE content LIKE '%normal form%' LIMIT 1);
SET @q5 = (SELECT question_id FROM question_bank WHERE content LIKE '%foreign key%' LIMIT 1);

-- Link questions to exams
INSERT IGNORE INTO exam_question (exam_id, question_id, marks) VALUES
(@exam1_id, @q1, 5),
(@exam1_id, @q2, 5),
(@exam1_id, @q5, 5);

INSERT IGNORE INTO exam_question (exam_id, question_id, marks) VALUES
(@exam2_id, @q2, 10),
(@exam2_id, @q3, 10),
(@exam2_id, @q5, 10);

INSERT IGNORE INTO exam_question (exam_id, question_id, marks) VALUES
(@exam3_id, @q3, 15),
(@exam3_id, @q4, 15),
(@exam3_id, @q5, 15);

-- Assign exams to students
SET @student_id = (SELECT user_id FROM users WHERE role='student' LIMIT 1);

INSERT IGNORE INTO student_exam (student_user_id, exam_id) VALUES
(@student_id, @exam1_id),
(@student_id, @exam2_id),
(@student_id, @exam3_id);

SELECT 'Sample data created successfully!' AS message;
SELECT COUNT(*) AS total_exams FROM exam;
SELECT COUNT(*) AS total_questions FROM question_bank;
SELECT COUNT(*) AS total_students FROM student;
