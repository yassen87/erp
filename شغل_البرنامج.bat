@echo off
echo ===================================================
echo Installing dependencies... Please wait.
echo It might take 1-2 minutes for the first time.
echo ===================================================
call npm install
echo ===================================================
echo Starting the application...
echo ===================================================
call npm start
pause
