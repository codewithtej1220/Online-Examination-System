# Login Credentials for OES Pro

## How to Login

1. Open your browser and navigate to: `http://localhost:5173/app/`
2. Use one of the credentials below to login

## Available Demo Users

### Faculty Accounts
- **Username:** `faculty_algorithms` | **Password:** `Password@123` | **Department:** Algorithms
- **Username:** `faculty_database` | **Password:** `Password@123` | **Department:** Database Systems
- **Username:** `faculty_networks` | **Password:** `Password@123` | **Department:** Computer Networks
- **Username:** `faculty_security` | **Password:** `Password@123` | **Department:** Cyber Security
- **Username:** `faculty_ai` | **Password:** `Password@123` | **Department:** Artificial Intelligence

### Student Accounts
- **Username:** `student_aarav` | **Password:** `Password@123` | **Semester:** 3
- **Username:** `student_ananya` | **Password:** `Password@123` | **Semester:** 3
- **Username:** `student_isha` | **Password:** `Password@123` | **Semester:** 4
- **Username:** `student_kabir` | **Password:** `Password@123` | **Semester:** 4
- **Username:** `student_meera` | **Password:** `Password@123` | **Semester:** 5
- **Username:** `student_nihal` | **Password:** `Password@123` | **Semester:** 5
- **Username:** `student_priya` | **Password:** `Password@123` | **Semester:** 6
- **Username:** `student_rohan` | **Password:** `Password@123` | **Semester:** 6
- **Username:** `student_saanvi` | **Password:** `Password@123` | **Semester:** 7
- **Username:** `student_vihaan` | **Password:** `Password@123` | **Semester:** 7

## Quick Test Logins

**Faculty:**
```
Username: faculty_algorithms
Password: Password@123
```

**Student:**
```
Username: student_aarav
Password: Password@123
```

## Need Fresh Data?

If you need to reset the database with fresh demo data, run:
```bash
node scripts\seed.js
```

This will:
- Clear all existing users, exams, and questions
- Create 5 faculty users
- Create 10 student users
- Generate 15 sample exams with questions
- Assign all exams to all students

## Troubleshooting

### Login not working?
1. Make sure all servers are running (Backend on port 5000, Frontend on port 5173)
2. Check if the database has been seeded: `node scripts\seed.js`
3. Verify MySQL is running
4. Check browser console for errors (F12)

### "Invalid username or password" error?
- The database may not be seeded. Run: `node scripts\seed.js`
- Double-check you're using the exact credentials above (case-sensitive)
- Password must be exactly: `Password@123` (with capital P and @ symbol)
