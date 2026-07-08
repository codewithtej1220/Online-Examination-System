const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const migrationFile = path.join(__dirname, 'migrations', '003_add_proctoring_logs.sql');

console.log('📦 Running Proctoring Logs Migration...');
console.log('File:', migrationFile);

fs.readFile(migrationFile, 'utf8', (err, sql) => {
  if (err) {
    console.error('❌ Error reading migration file:', err);
    process.exit(1);
  }

  // Split SQL by statement (simple split on semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let completed = 0;
  const total = statements.length;

  function runNext(index) {
    if (index >= statements.length) {
      console.log(`\n✅ Migration completed successfully! (${completed}/${total} statements)`);
      setTimeout(() => {
        db.end((err) => {
          if (err) console.error('Error closing connection:', err);
          process.exit(0);
        });
      }, 1000);
      return;
    }

    const statement = statements[index];
    if (!statement || statement === 'COMMIT') {
      runNext(index + 1);
      return;
    }

    db.query(statement, (error) => {
      if (error) {
        // Ignore "table already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  Table already exists, skipping... (${index + 1}/${total})`);
        } else {
          console.error(`❌ Error executing statement ${index + 1}:`, error.message);
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
