# 🚀 How to Run OES Pro

## The Absolute Easiest Way

### Step 1: First Time Only
Double-click: **`SETUP_FIRST_TIME.bat`**

Wait 5-10 minutes while it installs everything.

### Step 2: Every Time After
Double-click: **`START_ALL_SERVERS.bat`**

Wait 15 seconds, browser opens automatically! 🎉

### Step 3: When You're Done
Double-click: **`STOP_ALL_SERVERS.bat`**

---

## Alternative: Manual Method

Open **3 separate terminal windows** and run:

### Terminal 1: Backend
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
node server.js
```
Wait for: `OES server running on http://localhost:5000` ✅

### Terminal 2: Frontend
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
npm run client:dev
```
Wait for: `Local: http://localhost:5173/` ✅

### Terminal 3: AI Service
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES\ai-service
python main.py
```
Wait for: `Server running on: http://0.0.0.0:8000` ✅

---

## What You'll See

When all servers are running, you'll have **3 terminal windows**:

```
┌─────────────────────────────────────┐
│ Terminal 1: OES Backend             │
│ ✓ MySQL Connected Successfully     │
│ ✓ Socket.io service initialized     │
│ ✓ Server running on localhost:5000  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: OES Frontend            │
│ ✓ VITE ready in 234 ms              │
│ ✓ Local: http://localhost:5173/    │
│ ✓ press h + enter to show help      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 3: OES AI Service          │
│ ✓ Server running on: 0.0.0.0:8000  │
│ ✓ Documentation: /docs              │
│ ✓ Health check: /health             │
└─────────────────────────────────────┘
```

---

## Access Your Application

Open your browser and go to:

### 🌐 **http://localhost:5173/app/**

That's it! You're in! 🎊

---

## Login Credentials

Try these demo accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin1 | password123 |
| Faculty | faculty1 | password123 |
| Student | student1 | password123 |

---

## Quick Command Reference

| Action | Command |
|--------|---------|
| **Start Everything** | `START_ALL_SERVERS.bat` |
| **Stop Everything** | `STOP_ALL_SERVERS.bat` |
| **First Time Setup** | `SETUP_FIRST_TIME.bat` |
| **View Commands** | Open `QUICK_COMMANDS.txt` |
| **Full Instructions** | Open `RUN_INSTRUCTIONS.md` |

---

## Troubleshooting

### "Port already in use"
Kill the process using that port:
```cmd
netstat -ano | findstr :5000
taskkill /PID <number> /F
```

### "MySQL connection failed"
Start MySQL:
```cmd
net start MySQL80
```

### "Module not found" (Python)
Install dependencies:
```cmd
cd ai-service
pip install -r requirements.txt
```

### "Cannot find module" (Node.js)
Install dependencies:
```cmd
npm install
```

### Still Having Issues?
1. Check `RUN_INSTRUCTIONS.md` for detailed help
2. Check each terminal window for error messages
3. Ensure MySQL is running
4. Make sure `.env` files are configured

---

## System Requirements

✅ **Operating System:** Windows 10/11  
✅ **Node.js:** v20 or higher  
✅ **Python:** v3.9 or higher  
✅ **MySQL:** v8.0 or higher  
✅ **RAM:** 4GB minimum (8GB recommended)  
✅ **Disk Space:** 2GB for dependencies  

---

## What Each Server Does

### 🔷 Backend (Port 5000)
- REST API endpoints
- Database connections
- Authentication
- Business logic

### 🔷 Frontend (Port 5173)
- React user interface
- Student/Faculty/Admin dashboards
- Hot-reload for development

### 🔷 AI Service (Port 8000)
- Question generation (Gemini AI)
- Essay evaluation
- Advanced proctoring (computer vision, audio analysis)
- Face verification

---

## Development Mode Features

### ✅ Hot Reload
- **Frontend:** Changes appear instantly ⚡
- **Backend:** Restart manually (or use nodemon)
- **AI Service:** Restart manually

### 📝 Logs
Check each terminal window for real-time logs

### 🔍 Debug
- Frontend: Chrome DevTools (F12)
- Backend: Console logs in terminal
- AI Service: FastAPI docs at `/docs`

---

## Production Deployment

When you're ready to deploy:

```cmd
# Build frontend
npm run client:build

# Start in production mode
NODE_ENV=production node server.js
```

For advanced deployment, see `DEPLOYMENT.md`

---

## Need More Help?

📖 **Documentation Files:**
- `RUN_INSTRUCTIONS.md` - Detailed running instructions
- `QUICK_COMMANDS.txt` - Quick command reference
- `AI_INTEGRATION_SETUP.md` - AI service setup
- `README.md` - Full project documentation
- `START_HERE.md` - Project overview

🆘 **Support:**
- Check terminal output for errors
- Review `.env` configuration
- Verify MySQL is running
- Check port availability

---

## Quick Start Checklist

- [ ] MySQL is installed and running
- [ ] Node.js is installed (v20+)
- [ ] Python is installed (v3.9+)
- [ ] Ran `SETUP_FIRST_TIME.bat` (first time only)
- [ ] Configured `.env` file
- [ ] Configured `ai-service/.env` file
- [ ] Database schema created
- [ ] Double-clicked `START_ALL_SERVERS.bat`
- [ ] Browser opened to http://localhost:5173/app/
- [ ] Logged in successfully

✅ **You're all set!**

---

**Tip:** Bookmark this page for quick reference! 📌

🎉 **Happy coding with OES Pro!**
