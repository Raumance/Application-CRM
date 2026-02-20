@echo off
chcp 65001 >nul
echo ========================================
echo  Sync MongoDB local vers Atlas
echo ========================================
echo.

REM Charger .env si existe (format simple : MONGODB_URI=... ou ATLAS_URI=...)
set ATLAS_URI=
if exist .env (
    for /f "tokens=1,* delims==" %%a in ('findstr /b "MONGODB_URI ATLAS_URI" .env 2^>nul') do (
        if "%%a"=="MONGODB_URI" set ATLAS_URI=%%b
        if "%%a"=="ATLAS_URI" set ATLAS_URI=%%b
    )
)

if "%ATLAS_URI%"=="" (
    echo [ERREUR] Configurez MONGODB_URI dans .env avec votre URI Atlas.
    echo Exemple: MONGODB_URI=mongodb+srv://rnguema288:9476@nguema.dwb0ofa.mongodb.net/carwazplan_crm
    pause
    exit /b 1
)

set BACKUP_DIR=backup
set DB_NAME=carwazplan_crm

echo [1/2] Export depuis MongoDB local...
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
mongodump --uri="mongodb://localhost:27017" --db=%DB_NAME% --out=./%BACKUP_DIR%
if %errorlevel% neq 0 (
    echo [ERREUR] mongodump a échoué. MongoDB local est-il démarré ?
    echo Lancez: net start MongoDB
    pause
    exit /b 1
)
echo OK - Données exportées dans %BACKUP_DIR%\%DB_NAME%
echo.

echo [2/2] Import vers MongoDB Atlas...
mongorestore --uri="%ATLAS_URI%" ./%BACKUP_DIR%\%DB_NAME%
if %errorlevel% neq 0 (
    echo [ERREUR] mongorestore a échoué. Verifiez:
    echo   - Mot de passe correct dans .env
    echo   - IP autorisee dans Atlas (Network Access)
    pause
    exit /b 1
)
echo OK - Donnees importees sur Atlas
echo.
echo Synchronisation terminee. Redemarrez l'application pour utiliser Atlas.
pause
