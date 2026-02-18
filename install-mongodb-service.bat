@echo off
echo ========================================
echo   Installation MongoDB comme service Windows
echo ========================================
echo.
echo ATTENTION: Ce script doit etre execute en tant qu'administrateur!
echo.
pause

REM Creer le dossier de donnees MongoDB s'il n'existe pas
if not exist "C:\data\db" (
    echo Creation du dossier C:\data\db...
    mkdir C:\data\db
)

REM Installer MongoDB comme service Windows
echo Installation du service MongoDB...
mongod --install --serviceName "MongoDB" --serviceDisplayName "MongoDB Server" --dbpath "C:\data\db" --logpath "C:\data\db\mongod.log"

REM Demarrer le service
echo Demarrage du service MongoDB...
net start MongoDB

echo.
echo ========================================
echo   MongoDB installe et demarre!
echo ========================================
echo.
echo Le service MongoDB demarrera automatiquement au demarrage de Windows.
echo.
pause
