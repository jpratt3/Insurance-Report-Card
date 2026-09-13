@echo off
cd /d "%~dp0"
title Insurance Report Card

if not exist "node_modules\" (
  echo Installing dependencies. This takes a minute the first time...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Read the error above.
    pause
    exit /b 1
  )
)

rem Already running? Just open the browser rather than failing on a port clash.
netstat -ano -p tcp | findstr /c:"LISTENING" | findstr /c:":9000 " >nul
if not errorlevel 1 (
  echo.
  echo The app is already running on port 9000 - opening the browser.
  echo Close the other Insurance Report Card window if you want a fresh start.
  start "" "http://localhost:9000/login"
  echo.
  pause
  exit /b 0
)

echo.
echo Insurance Report Card  -  http://localhost:9000
echo   PM login:  PortfolioManager  /  ABCcapital123
echo   CFO login: the username and password set when the company was added.
echo.
echo Leave this window open. Close it to stop the app.
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for ($i=0; $i -lt 90; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:9000/login' | Out-Null; Start-Process 'http://localhost:9000/login'; break } catch { Start-Sleep -Seconds 1 } }"

call npm run dev

echo.
echo The dev server stopped. Read any error above.
pause
