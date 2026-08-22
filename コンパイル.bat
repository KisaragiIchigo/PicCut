@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   PicCut Ultra - Build and Package (Release)
echo   1. Portable EXE (Single file)
echo   2. Setup Installer EXE
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

echo [1/3] Running TypeScript typecheck...
call npm run typecheck
if errorlevel 1 (
    echo [ERROR] Typecheck failed!
    pause
    exit /b 1
)

echo [2/3] Building Vite production assets...
call npm run build:vite
if errorlevel 1 (
    echo [ERROR] Vite build failed!
    pause
    exit /b 1
)

echo [3/3] Packaging Windows binaries (Portable and Installer)...
call npx electron-builder --config electron-builder.json5
if errorlevel 1 (
    echo [ERROR] Packaging failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] Build completed successfully!
echo   Output folder: Release\
echo     - PicCut_Ultra_Portable.exe
echo     - PicCut_Ultra_Setup_Installer.exe
echo ========================================================
echo.

if exist "Release" (
    start "" "Release"
)

pause