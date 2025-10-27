@echo off
:: Batch file to install dependencies and start backend & frontend with admin privileges

:: === Start backend ===
echo Starting backend setup...
start "Backend" powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"C:\Users\casli\OneDrive\Bureaublad\Artsenportaal\backend\" && echo Installing backend dependencies... && npm install && echo Starting backend server... && npm run develop' -Verb RunAs"

:: Wait 20 seconds to give backend time to start
timeout /t 20 /nobreak >nul

:: === Start frontend ===
echo Starting frontend setup...
start "Frontend" powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"C:\Users\casli\OneDrive\Bureaublad\Artsenportaal\frontend\" && echo Installing frontend dependencies... && npm install && echo Starting frontend server... && npm start' -Verb RunAs"

exit
