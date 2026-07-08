-- Quick Test Data for Phase 1-6 Features
-- Run this to instantly set up a complete test scenario

USE online_exam_system;

-- Insert sample questions
INSERT INTO question_bank (faculty_user_id, content, question_type, correct_answer, option_a, option_b, option_c, option_d, difficulty_level, subject_topic, tags) VALUES
(4, 'What is 2 + 2?', 'MCQ', 'B', '3', '4', '5', '6', 'EASY', 'Mathematics', 'arithmetic,basic'),
(4, 'What is the capital of France?', 'MCQ', 'B', 'London', 'Paris', 'Berlin', 'Rome', 'EASY', 'Geography', 'capitals,europe'),
(4, 'What is 10 * 5?', 'MCQ', 'C', '40', '45', '50', '55', 'EASY', 'Mathematics', 'multiplication,basic'),
(4, 'Which planet is closest to the Sun?', 'MCQ', 'A', 'Mercury', 'Venus', 'Earth', 'Mars', 'MEDIUM', 'Science', 'astronomy,planets'),
(4, 'What is the chemical symbol for water?', 'MCQ', 'B', 'O2', 'H2O', 'CO2', 'H2', 'EASY', 'Chemistry', 'elements,basic'),
(4, 'Who wrote Romeo and Juliet?', 'MCQ', 'D', 'Charles Dickens', 'Mark Twain', 'Jane Austen', 'William Shakespeare', 'MEDIUM', 'Literature', 'authors,classics'),
(4, 'What is the square root of 64?', 'MCQ', 'B', '6', '8', '10', '12', 'EASY', 'Mathematics', 'algebra,roots'),
(4, 'Which gas do plants absorb from the atmosphere?', 'MCQ', 'C', 'Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen', 'EASY', 'Biology', 'photosynthesis,plants'),
(4, 'What year did World War II end?', 'MCQ', 'B', '1944', '1945', '1946', '1947', 'MEDIUM', 'History', 'war,dates'),
(4, 'What is the largest ocean on Earth?', 'MCQ', 'A', 'Pacific', 'Atlantic', 'Indian', 'Arctic', 'EASY', 'Geography', 'oceans,earth');

-- Create a sample exam
INSERT INTO examination (faculty_user_id, title, duration_minutes, scheduled_time, created_at) VALUES
(4, 'Sample Midterm Exam', 30, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW());

-- Get the exam_id (will be the last inserted)
SET @exam_id = LAST_INSERT_ID();

-- Assign all 10 questions to the exam
INSERT INTO exam_questions (exam_id, question_id) 
SELECT @exam_id, question_id FROM question_bank LIMIT 10;

-- Assign exam to student (steve - user_id 1)
INSERT INTO student_exam (exam_id, student_user_id) VALUES
(@exam_id, 1);

-- Display the exam ID for reference
SELECT @exam_id as 'Created Exam ID', 
       COUNT(*) as 'Questions Assigned' 
FROM exam_questions 
WHERE exam_id = @exam_id;

-- Show what was created
SELECT 
    'Exam Created' as Status,
    e.exam_id,
    e.title as 'Exam Title',
    e.duration_minutes as 'Duration (min)',
    COUNT(eq.question_id) as 'Questions',
    GROUP_CONCAT(DISTINCT se.student_user_id) as 'Assigned to Students'
FROM examination e
LEFT JOIN exam_questions eq ON e.exam_id = eq.exam_id
LEFT JOIN student_exam se ON e.exam_id = se.exam_id
WHERE e.exam_id = @exam_id
GROUP BY e.exam_id;

-- Success message
SELECT 
    '✅ Test data created successfully!' as Message,
    'Login as student (student1/pass) and start the exam!' as 'Next Step';
