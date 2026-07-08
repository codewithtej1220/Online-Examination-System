require('dotenv').config();
const db = require('./config/db');

console.log('📦 Creating Phase 2 tables and columns...\n');

const alterations = [
  // Add columns to examination table
  `ALTER TABLE examination ADD COLUMN calculator_enabled BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE examination ADD COLUMN is_practice BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE examination ADD COLUMN practice_attempts_allowed INT DEFAULT -1`,
  `ALTER TABLE examination ADD COLUMN auto_submit_on_timeout BOOLEAN DEFAULT TRUE`,
  `ALTER TABLE examination ADD COLUMN show_timer_warnings BOOLEAN DEFAULT TRUE`,
  
  // Add columns to attempt table (not exam_attempt)
  `ALTER TABLE attempt ADD COLUMN bookmarked_questions JSON DEFAULT NULL`,
  `ALTER TABLE attempt ADD COLUMN time_extended_seconds INT DEFAULT 0`,
  `ALTER TABLE attempt ADD COLUMN time_extension_reason VARCHAR(500) DEFAULT NULL`,
  `ALTER TABLE attempt ADD COLUMN auto_submitted BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE attempt ADD COLUMN answers_draft JSON DEFAULT NULL`
];

const tables = [
  // answer_drafts table
  `CREATE TABLE IF NOT EXISTS answer_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    draft_answer JSON NOT NULL,
    is_synced BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_question (question_id),
    INDEX idx_synced (is_synced),
    UNIQUE KEY unique_draft (attempt_id, question_id)
  )`,
  
  // practice_attempts table
  `CREATE TABLE IF NOT EXISTS practice_attempts (
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
    answers JSON DEFAULT NULL,
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_completed (completed_at)
  )`,
  
  // exam_analytics table
  `CREATE TABLE IF NOT EXISTS exam_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    attempt_id INT DEFAULT NULL,
    total_practice_attempts INT DEFAULT 0,
    average_practice_score DECIMAL(5,2) DEFAULT NULL,
    best_practice_score DECIMAL(5,2) DEFAULT NULL,
    actual_exam_score DECIMAL(5,2) DEFAULT NULL,
    improvement_percentage DECIMAL(5,2) DEFAULT NULL,
    weak_topics JSON DEFAULT NULL,
    strong_topics JSON DEFAULT NULL,
    time_management_score DECIMAL(5,2) DEFAULT NULL,
    completion_rate DECIMAL(5,2) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id),
    UNIQUE KEY unique_student_exam (student_user_id, exam_id)
  )`,
  
  // time_extensions table
  `CREATE TABLE IF NOT EXISTS time_extensions (
    extension_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_user_id INT NOT NULL,
    exam_id INT NOT NULL,
    faculty_user_id INT NOT NULL,
    extension_seconds INT NOT NULL,
    reason VARCHAR(500) DEFAULT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempt (attempt_id),
    INDEX idx_student (student_user_id),
    INDEX idx_exam (exam_id)
  )`
];

let completed = 0;
const total = alterations.length + tables.length;

// Run alterations
alterations.forEach((sql, index) => {
  db.query(sql, (error) => {
    if (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
        console.log(`✓ Column ${index + 1} already exists`);
      } else {
        console.error(`❌ Error adding column ${index + 1}:`, error.message);
      }
    } else {
      console.log(`✓ Column ${index + 1} added successfully`);
    }
    
    completed++;
    if (completed === total) finish();
  });
});

// Run table creations
tables.forEach((sql, index) => {
  db.query(sql, (error) => {
    if (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`✓ Table ${index + 1} already exists`);
      } else {
        console.error(`❌ Error creating table ${index + 1}:`, error.message);
      }
    } else {
      console.log(`✓ Table ${index + 1} created successfully`);
    }
    
    completed++;
    if (completed === total) finish();
  });
});

function finish() {
  console.log('\n✅ Phase 2 schema ready');
  db.end();
}
