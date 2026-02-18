@echo off
echo ========================================
echo   Redemarrage du serveur CRM
echo ========================================
echo.
echo 1. Arret des serveurs Node.js en cours...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo    Serveurs arretes.
) else (
    echo    Aucun serveur a arreter.
)
timeout /t 2 /nobreak >nul
echo.
echo 2. Demarrage du CRM (backend + frontend)...
start "CRM CarWazPlan" cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo ========================================
echo   Serveur demarré !
echo.
echo   Ouvrez http://localhost:5173 dans votre navigateur
echo ========================================
timeout /t 3
