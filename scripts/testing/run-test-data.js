const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupTestData() {
  let connection;
  
  try {
    console.log('📊 Setting up test data...\n');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'oes_db',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'quick-test-data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL
    console.log('📝 Creating questions, exam, and assignments...\n');
    const [results] = await connection.query(sql);
    
    // Get the created exam details
    const [examInfo] = await connection.query(`
      SELECT 
        e.exam_id,
        e.title,
        e.duration_minutes,
        COUNT(DISTINCT eq.question_id) as question_count,
        GROUP_CONCAT(DISTINCT se.student_user_id) as assigned_students
      FROM examination e
      LEFT JOIN exam_questions eq ON e.exam_id = eq.exam_id
      LEFT JOIN student_exam se ON e.exam_id = se.exam_id
      WHERE e.exam_id = (SELECT MAX(exam_id) FROM examination)
      GROUP BY e.exam_id
    `);
    
    if (examInfo.length > 0) {
      const exam = examInfo[0];
      console.log('✅ Test data created successfully!\n');
      console.log('📋 Created Exam Details:');
      console.log('  • Exam ID:', exam.exam_id);
      console.log('  • Title:', exam.title);
      console.log('  • Duration:', exam.duration_minutes, 'minutes');
      console.log('  • Questions:', exam.question_count);
      console.log('  • Assigned to Student ID:', exam.assigned_students || 'None');
      console.log('\n');
      console.log('🎯 Next Steps:');
      console.log('  1. Open http://localhost:5000');
      console.log('  2. Login as: student1 / pass');
      console.log('  3. Verify your student ID');
      console.log('  4. Start "' + exam.title + '"');
      console.log('  5. See ALL Phase 1-6 features! 🎉\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupTestData();
