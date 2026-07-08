const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const migrationFile = path.join(__dirname, 'migrations', '004_phase2_enhancements.sql');

console.log('📦 Running Phase 2 Migration...');
console.log('File:', migrationFile);

fs.readFile(migrationFile, 'utf8', (err, sql) => {
  if (err) {
    console.error('❌ Error reading migration file:', err);
    process.exit(1);
  }

  // Split SQL by statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');

  let completed = 0;
  const total = statements.length;

  function runNext(index) {
    if (index >= statements.length) {
      console.log(`\n✅ Phase 2 Migration completed! (${completed}/${total} statements)`);
      setTimeout(() => {
        db.end((err) => {
          if (err) console.error('Error closing connection:', err);
          process.exit(0);
        });
      }, 1000);
      return;
    }

    const statement = statements[index];
    if (!statement) {
      runNext(index + 1);
      return;
    }

    db.query(statement, (error) => {
      if (error) {
        // Ignore certain errors
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
          console.log(`⚠️  Column already exists, skipping... (${index + 1}/${total})`);
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  Table already exists, skipping... (${index + 1}/${total})`);
        } else {
          console.error(`❌ Error in statement ${index + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      } else {
        completed++;
        console.log(`✓ Statement ${index + 1}/${total} executed`);
      }
      runNext(index + 1);
    });
  }

  console.log(`\nExecuting ${total} SQL statements...\n`);
  runNext(0);
});
