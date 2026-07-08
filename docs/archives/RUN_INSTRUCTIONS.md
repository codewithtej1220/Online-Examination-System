# 🚀 How to Run OES Pro - Complete Guide

## Quick Start (3 Steps)

### First Time Setup:
1. **Double-click:** `SETUP_FIRST_TIME.bat`
2. **Wait:** 5-10 minutes for installation
3. **Configure:** Edit `.env` files when prompted

### Every Time After:
1. **Start MySQL:** Ensure MySQL service is running
2. **Double-click:** `START_ALL_SERVERS.bat`
3. **Wait:** 10-15 seconds for servers to start
4. **Browser opens automatically** to http://localhost:5173/app/

---

## Manual Commands (Alternative Method)

### Terminal 1: Backend Server
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
node server.js
```

### Terminal 2: Frontend Server
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES
npm run client:dev
```

### Terminal 3: AI Microservice
```cmd
cd c:\Users\bhanu\OneDrive\Documents\Dbms_OES\ai-service
python main.py
```

---

## Using VS Code / Kiro (Your Current Setup)

### All Three Servers at Once:
```javascript
// In Kiro/VS Code terminal, run these in separate terminals:

// Terminal 1
node server.js

// Terminal 2  
npm run client:dev

// Terminal 3
cd ai-service && python main.py
```

### Or Use Kiro's Process Management:
Kiro can start processes automatically - just run:
```
control_pwsh_process with action="start" for each server
```

---

## One-Line Commands

### Windows PowerShell (Run All):
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\bhanu\OneDrive\Documents\Dbms_OES'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\bhanu\OneDrive\Documents\Dbms_OES'; npm run client:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\bhanu\OneDrive\Documents\Dbms_OES\ai-service'; python main.py"
```

### Windows CMD (Run All):
```cmd
start cmd /k "cd /d c:\Users\bhanu\OneDrive\Documents\Dbms_OES && node server.js"
start cmd /k "cd /d c:\Users\bhanu\OneDrive\Documents\Dbms_OES && npm run client:dev"
start cmd /k "cd /d c:\Users\bhanu\OneDrive\Documents\Dbms_OES\ai-service && python main.py"
```

---

## Access Points

Once all servers are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173/app/ | Main application |
| **Backend API** | http://localhost:5000/api/ | REST API endpoints |
| **AI Service** | http://localhost:8000 | AI microservice |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |

---

## Stopping Servers

### Option 1: Double-click
```
STOP_ALL_SERVERS.bat
```

### Option 2: Manual
Press **Ctrl+C** in each terminal window

### Option 3: Task Manager
Kill processes:
- `node.exe` (backend)
- `node.exe` (frontend - Vite)
- `python.exe` (AI service)

---

## Troubleshooting

### "Port 5000 already in use"
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Port 5173 already in use"  
```cmd
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### "Port 8000 already in use"
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "MySQL connection failed"
1. Start MySQL service:
   ```cmd
   net start MySQL80
   ```
2. Or use MySQL Workbench/XAMPP to start MySQL

### "ModuleNotFoundError" (Python)
```cmd
cd ai-service
pip install -r requirements.txt
```

### "Cannot find module" (Node.js)
```cmd
npm install
```

---

## Development Mode Features

### Auto-Reload:
- ✅ **Frontend:** Vite hot-reload (instant)
- ✅ **Backend:** Manual restart needed (or use nodemon)
- ✅ **AI Service:** Manual restart needed

### To Enable Backend Auto-Reload:
```cmd
npm install -g nodemon
nodemon server.js
```

---

## Production Deployment

### Build Frontend:
```cmd
npm run client:build
```

### Start Production:
```cmd
NODE_ENV=production node server.js
```

### Use PM2 (Process Manager):
```cmd
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│  OES Pro Quick Reference                │
├─────────────────────────────────────────┤
│  Start All:  START_ALL_SERVERS.bat      │
│  Stop All:   STOP_ALL_SERVERS.bat       │
│  Setup:      SETUP_FIRST_TIME.bat       │
│                                          │
│  Frontend:   http://localhost:5173/app/ │
│  Backend:    http://localhost:5000      │
│  AI Service: http://localhost:8000      │
│  API Docs:   http://localhost:8000/docs │
└─────────────────────────────────────────┘
```

---

## Need Help?

1. Check `README.md` for full documentation
2. Check `START_HERE.md` for quick start
3. Check server logs in each terminal
4. Check `TROUBLESHOOTING.md` (if available)

---

**Tip:** Bookmark http://localhost:5173/app/ for quick access!

🎉 **Happy coding!**
