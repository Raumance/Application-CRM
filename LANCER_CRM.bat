@echo off
title CRM CarWazPlan
echo ========================================
echo   Demarrage du CRM CarWazPlan
echo ========================================
echo.
echo Demarrage du backend (port 4000) et frontend (port 5173)...
echo.
echo Une fois demarré :
echo   - Ouvrez http://localhost:5173 dans votre navigateur
echo   - Ne fermez pas cette fenêtre
echo.
echo ========================================
cd /d "%~dp0"
npm run dev:all
pause
