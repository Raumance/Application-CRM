@echo off
echo ========================================
echo   Demarrage du CRM CarWazPlan
echo ========================================
echo.

REM Verifier si PM2 est installe
where pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] PM2 n'est pas installe.
    echo Installez-le avec: npm install -g pm2
    pause
    exit /b 1
)

REM Creer le dossier logs s'il n'existe pas
if not exist "logs" mkdir logs

REM Demarrer le serveur avec PM2
echo Demarrage du serveur backend...
pm2 start ecosystem.config.js

REM Afficher le statut
echo.
echo ========================================
echo   Serveur demarre avec PM2
echo ========================================
pm2 status
echo.
echo Pour voir les logs: pm2 logs crm-carwazplan-backend
echo Pour arreter: pm2 stop crm-carwazplan-backend
echo Pour redemarrer: pm2 restart crm-carwazplan-backend
echo.
pause
