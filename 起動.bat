@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   PicCut Ultra - Launcher
echo ========================================================
echo.

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [INFO] Starting PicCut Ultra...
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Application terminated with error.
    pause
)