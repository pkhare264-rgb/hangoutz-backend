@echo off
REM Firebase Setup Script for Windows
REM This script copies the Firebase files to the correct locations

echo ================================================
echo Firebase Backend Setup Script
echo ================================================
echo.

REM Get the backend directory
set BACKEND_DIR=%cd%
echo Current directory: %BACKEND_DIR%
echo.

REM Create directories if they don't exist
echo [1/4] Creating directories...
if not exist "config" mkdir config
if not exist "middleware" mkdir middleware
echo   - Created config and middleware folders
echo.

REM Check if Downloads folder exists
set DOWNLOADS=%USERPROFILE%\Downloads
if not exist "%DOWNLOADS%" (
    echo ERROR: Downloads folder not found!
    echo Please specify the path to your Downloads folder.
    pause
    exit /b 1
)

REM Copy Firebase files
echo [2/4] Copying Firebase files from Downloads...
echo.

REM Check and copy firebase-admin
if exist "%DOWNLOADS%\firebase-admin-ES6.js" (
    copy "%DOWNLOADS%\firebase-admin-ES6.js" "config\firebase-admin.js" >nul
    echo   ✓ Copied firebase-admin-ES6.js -> config\firebase-admin.js
) else (
    echo   ✗ firebase-admin-ES6.js not found in Downloads
    set MISSING=1
)

REM Check and copy firebase-auth-middleware
if exist "%DOWNLOADS%\firebase-auth-middleware-ES6.js" (
    copy "%DOWNLOADS%\firebase-auth-middleware-ES6.js" "middleware\firebase-auth.js" >nul
    echo   ✓ Copied firebase-auth-middleware-ES6.js -> middleware\firebase-auth.js
) else (
    echo   ✗ firebase-auth-middleware-ES6.js not found in Downloads
    set MISSING=1
)

REM Check and copy firebase-auth-routes
if exist "%DOWNLOADS%\firebase-auth-routes-ES6.js" (
    copy "%DOWNLOADS%\firebase-auth-routes-ES6.js" "routes\firebase-auth.js" >nul
    echo   ✓ Copied firebase-auth-routes-ES6.js -> routes\firebase-auth.js
) else (
    echo   ✗ firebase-auth-routes-ES6.js not found in Downloads
    set MISSING=1
)

echo.

REM Check for firebase-service-account.json
echo [3/4] Checking for firebase-service-account.json...
if exist "firebase-service-account.json" (
    echo   ✓ firebase-service-account.json found
) else (
    echo   ✗ firebase-service-account.json NOT found
    echo.
    echo   ACTION REQUIRED:
    echo   1. Go to https://console.firebase.google.com
    echo   2. Project Settings -^> Service Accounts
    echo   3. Click "Generate new private key"
    echo   4. Save the downloaded file as "firebase-service-account.json"
    echo   5. Place it in: %BACKEND_DIR%
    echo.
    set MISSING=1
)

echo.

REM Install firebase-admin
echo [4/4] Installing firebase-admin package...
echo.
call npm install firebase-admin
echo.

REM Final status
echo ================================================
echo Setup Complete!
echo ================================================
echo.

if defined MISSING (
    echo ⚠ WARNING: Some files are missing!
    echo Please review the messages above.
    echo.
) else (
    echo ✓ All files copied successfully!
    echo.
)

echo Next steps:
echo 1. Make sure firebase-service-account.json is in the backend folder
echo 2. Run: npm run dev
echo.

echo File structure:
echo %BACKEND_DIR%\
echo ├── config\firebase-admin.js
echo ├── middleware\firebase-auth.js
echo ├── routes\firebase-auth.js
echo └── firebase-service-account.json
echo.

pause
