@echo off
REM =========================================
REM   OES Pro - Stop All Servers
REM =========================================

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║     OES Pro - Stopping All Servers                ║
echo ╚═══════════════════════════════════════════════════╝
echo.

echo Stopping Node.js processes...
taskkill /FI "WINDOWTITLE eq OES Backend*" /T /F 2>NUL
taskkill /FI "WINDOWTITLE eq OES Frontend*" /T /F 2>NUL

echo Stopping Python processes...
taskkill /FI "WINDOWTITLE eq OES AI Service*" /T /F 2>NUL

echo.
echo ✓ All servers stopped
echo.
pause
