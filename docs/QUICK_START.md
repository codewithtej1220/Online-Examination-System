# 🚀 OES Pro - Quick Start Guide

Get your Online Examination System running in 5 minutes!

## Prerequisites

- ✅ MySQL 8.0+ installed and running
- ✅ Node.js 20+ installed
- ✅ Python 3.9+ installed
- ✅ 4GB RAM minimum

## Step 1: First Time Setup

Double-click the setup script:
```
SETUP_FIRST_TIME.bat
```

This will:
- Install Node.js dependencies (~2 min)
- Install Python AI dependencies (~5 min)
- Set up database schema
- Configure environment files

## Step 2: Configure API Keys

Edit `ai-service\.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

Get your key from: https://makersuite.google.com/app/apikey

## Step 3: Start the System

Double-click the start script:
```
START_ALL_SERVERS.bat
```

This starts:
- Express Backend (Port 5000)
- React Frontend (Port 5173)
- AI Microservice (Port 8000)

## Step 4: Access the Application

Browser opens automatically to:
```
http://localhost:5173/app/
```

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin1 | password123 |
| Faculty | faculty1 | password123 |
| Student | student1 | password123 |

## What's Next?

- 📖 Read the [Full Documentation](./README.md)
- 🎯 Learn about [Features](./features/)
- 🔧 See [Configuration Options](./setup/CONFIGURATION.md)
- 🚨 Check [Troubleshooting](./TROUBLESHOOTING.md) if you have issues

## Quick Commands

| Action | Command |
|--------|---------|
| Start all servers | `START_ALL_SERVERS.bat` |
| Stop all servers | `STOP_ALL_SERVERS.bat` |
| View logs | Check terminal windows |
| Restart services | Stop, then start again |

---

**Need help?** See [../HOW_TO_RUN.md](../HOW_TO_RUN.md) for detailed instructions.
