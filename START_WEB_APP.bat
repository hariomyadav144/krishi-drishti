@echo off
title Fasal Drishti Web - VIP Demonstration Launcher
color 0A

echo =====================================================================
echo       FASAL DRISHTI (फसल दृष्टि) - VIP DEMONSTRATION LAUNCHER
echo          माननीय सांसद / विधायक महोदय के समक्ष लाइव प्रदर्शन
echo =====================================================================
echo.

cd /d "%~dp0frontend"

echo [1/3] Checking environment & dependencies...
if not exist "node_modules" (
    echo Installing required packages...
    call npm install
)

echo [2/3] Starting Fasal Drishti Web Server...
start "Fasal Drishti Dev Server" /min cmd /c "npm run dev"

echo [3/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo  Fasal Drishti Web is LIVE at: http://localhost:5173/#/home
echo =====================================================================
echo.
echo Opening browser in full presentation window...

start http://localhost:5173/#/home

echo.
echo ---------------------------------------------------------------------
echo  TIPS FOR PRESENTATION (सांसद/विधायक जी के सामने प्रस्तुति के टिप्स):
echo  1. Press F11 on keyboard for Fullscreen Presentation.
echo  2. Click 'Phone View' to show the exact smartphone app.
echo  3. Click 'Desktop View' to show the full district dashboard.
echo  4. Click '1-Click Demo' to switch Farmer, Scientist, or Admin.
echo ---------------------------------------------------------------------
echo.
pause
