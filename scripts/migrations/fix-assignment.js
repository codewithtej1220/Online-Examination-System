const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('📝 Fixing exam assignment...\n');
  
  // Get the latest exam
  const [exams] = await conn.query('SELECT exam_id FROM examination ORDER BY exam_id DESC LIMIT 1');
  const examId = exams[0].exam_id;
  
  // Delete old assignment
  await conn.query('DELETE FROM student_exam WHERE exam_id = ?', [examId]);
  
  // Assign to student user_id 16 (stevey)
  await conn.query('INSERT INTO student_exam (exam_id, student_user_id) VALUES (?, ?)', [examId, 16]);
  
  console.log('✅ Exam reassigned successfully!');
  console.log('  • Exam ID:', examId);
  console.log('  • Assigned to Student ID: 16 (stevey)');
  console.log('\n🎯 Now refresh your browser and select the exam!');
  
  await conn.end();
})();
