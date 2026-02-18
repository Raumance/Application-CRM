@echo off
chcp 65001 >nul
echo ========================================
echo   CRM CarWazPlan - Démarrage réseau
echo ========================================
echo.
echo Vérification du build...
if not exist "%~dp0client\dist\index.html" (
    echo Le frontend n'est pas encore compilé.
    echo Construction en cours...
    cd /d "%~dp0"
    call npm run build
    if %errorlevel% neq 0 (
        echo ERREUR: Construction échouée.
        pause
        exit /b 1
    )
    echo.
)
echo.
echo Démarrage du serveur...
echo.
echo Accès local  : http://localhost:4000
echo Accès réseau : http://<192.168.1.72>:4000
echo.
echo Pour voir votre IP : ipconfig
echo.
cd /d "%~dp0"
set NODE_ENV=production
set HOST=0.0.0.0
node src/server.js
pause
