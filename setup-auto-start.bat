@echo off
echo ========================================
echo   Configuration du demarrage automatique
echo ========================================
echo.
echo ATTENTION: Ce script doit etre execute en tant qu'administrateur!
echo.
pause

REM Verifier si PM2 est installe
where pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] PM2 n'est pas installe.
    echo Installez-le avec: npm install -g pm2
    pause
    exit /b 1
)

REM Demarrer le serveur avec PM2
echo Demarrage du serveur...
pm2 start ecosystem.config.js

REM Sauvegarder la configuration PM2
echo Sauvegarde de la configuration PM2...
pm2 save

REM Configurer le demarrage automatique au boot Windows
echo Configuration du demarrage automatique...
pm2 startup

echo.
echo ========================================
echo   Configuration terminee!
echo ========================================
echo.
echo Le serveur demarrera automatiquement au demarrage de Windows.
echo.
echo Commandes utiles:
echo   - Voir le statut: pm2 status
echo   - Voir les logs: pm2 logs crm-carwazplan-backend
echo   - Redemarrer: pm2 restart crm-carwazplan-backend
echo.
pause
