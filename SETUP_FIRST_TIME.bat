@echo off
REM =========================================
REM   OES Pro - First Time Setup
REM =========================================

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║     OES Pro - First Time Setup                    ║
echo ║     This will take 5-10 minutes                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Install Node.js dependencies
echo [1/3] Installing Node.js dependencies...
echo This may take 2-3 minutes...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo ✓ Node.js dependencies installed
echo.

REM Install Python AI service dependencies
echo [2/3] Installing Python AI dependencies...
echo This may take 5-7 minutes (includes TensorFlow, OpenCV, MediaPipe)...
cd ai-service
call pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to install Python dependencies
    echo.
    echo Try running manually:
    echo cd ai-service
    echo pip install -r requirements.txt
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Python dependencies installed
echo.

REM Setup database
echo [3/3] Database setup...
echo Please ensure MySQL is running and you have created the database:
echo   CREATE DATABASE online_exam_system;
echo.
echo Do you want to run the database schema? (Y/N)
set /p SETUP_DB=
if /i "%SETUP_DB%"=="Y" (
    echo Enter MySQL root password:
    mysql -u root -p online_exam_system < schema.sql
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Database schema created
        
        REM Run AI integration schema updates
        echo.
        echo Setting up AI integration tables...
        mysql -u root -p online_exam_system < schema-updates-ai.sql
        if %ERRORLEVEL% EQU 0 (
            echo ✓ AI integration schema updated
        ) else (
            echo ⚠ AI schema update failed (you can run it later)
        )
    ) else (
        echo ✗ Database setup failed
    )
) else (
    echo ℹ Skipped database setup
    echo Run manually: mysql -u root -p online_exam_system < schema.sql
)
echo.

REM Check .env file
echo [4/3] Checking configuration...
if exist ".env" (
    echo ✓ .env file found
) else (
    echo ⚠ .env file not found
    echo Copying from .env.example...
    copy .env.example .env
    echo.
    echo ⚠ IMPORTANT: Edit .env file and set your database password!
    notepad .env
)

REM Check AI service .env
if exist "ai-service\.env" (
    echo ✓ AI service .env file found
) else (
    echo ⚠ AI service .env file not found
    echo Copying from .env.example...
    cd ai-service
    copy .env.example .env
    echo.
    echo ⚠ IMPORTANT: Edit ai-service\.env and set your GEMINI_API_KEY!
    echo Get API key from: https://makersuite.google.com/app/apikey
    notepad .env
    cd ..
)

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║     Setup Complete!                               ║
echo ║                                                   ║
echo ║  Next steps:                                      ║
echo ║  1. Ensure MySQL is running                       ║
echo ║  2. Check .env files are configured               ║
echo ║  3. Run START_ALL_SERVERS.bat                     ║
echo ╚═══════════════════════════════════════════════════╝
echo.

pause
