@echo off
echo.
echo ============================================
echo   DATABASE FIX SCRIPT
echo ============================================
echo.

echo Connecting to MongoDB...
mongosh hangoutz --eval "db.users.dropIndex('firebaseUid_1')" 2>nul
if %errorlevel% equ 0 (
    echo [OK] Dropped old index
) else (
    echo [INFO] Index already removed or doesn't exist
)

echo.
echo Clearing collections...
mongosh hangoutz --eval "db.users.deleteMany({})"
mongosh hangoutz --eval "db.events.deleteMany({})"
mongosh hangoutz --eval "db.conversations.deleteMany({})"
mongosh hangoutz --eval "db.messages.deleteMany({})"

echo.
echo ============================================
echo   DATABASE FIXED!
echo ============================================
echo.
echo Now run: npm run seed
echo.
pause
