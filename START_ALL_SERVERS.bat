@echo off
REM =========================================
REM   OES Pro - Start All Servers
REM =========================================

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║     OES Pro - Starting All Servers                ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Check if MySQL is running
echo [1/4] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MySQL is running
) else (
    echo ✗ MySQL is NOT running!
    echo Please start MySQL service first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
echo [2/4] Checking Node.js...
node --version >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

REM Check if Python is installed
echo [3/4] Checking Python...
python --version >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Python is not installed!
    echo Please install Python 3.9+ from https://python.org/
    pause
    exit /b 1
)
echo ✓ Python is installed

echo [4/4] Starting servers...
echo.

REM Start Backend Server
echo Starting Express Backend (Port 5000)...
start "OES Backend" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 3 /nobreak >NUL

REM Start Frontend Server
echo Starting React Frontend (Port 5173)...
start "OES Frontend" cmd /k "cd /d "%~dp0" && npm run client:dev"
timeout /t 3 /nobreak >NUL

REM Start AI Microservice
echo Starting AI Microservice (Port 8000)...
start "OES AI Service" cmd /k "cd /d "%~dp0ai-service" && python main.py"
timeout /t 3 /nobreak >NUL

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║     All Servers Started!                          ║
echo ║                                                   ║
echo ║  Backend:   http://localhost:5000                ║
echo ║  Frontend:  http://localhost:5173/app/          ║
echo ║  AI Service: http://localhost:8000               ║
echo ║  API Docs:   http://localhost:8000/docs         ║
echo ║                                                   ║
echo ║  Press Ctrl+C in each window to stop            ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Open browser
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >NUL
start http://localhost:5173/app/

pause
