@echo off
chcp 65001 >nul
echo ========================================
echo   Déploiement CRM CarWazPlan - Réseau
echo ========================================
echo.
echo 1. Construction du frontend...
cd /d "%~dp0"
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La construction du frontend a échoué.
    pause
    exit /b 1
)
echo    Build terminé avec succès.
echo.
echo 2. Démarrage du serveur en mode production...
echo    Le CRM sera accessible sur TOUT le réseau de l'entreprise.
echo.
echo    Sur CETTE machine : http://localhost:4000
echo    Depuis les autres PC  : http://<IP-DE-CETTE-MACHINE>:4000
echo.
echo    Pour connaître l'IP : ipconfig ^| findstr "IPv4"
echo.
echo ========================================
call npm start
