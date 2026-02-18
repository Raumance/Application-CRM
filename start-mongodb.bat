@echo off
echo ========================================
echo   Demarrage de MongoDB
echo ========================================
echo.

REM Vérifier si MongoDB est déjà démarré
sc query MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo Vérification du statut de MongoDB...
    sc query MongoDB | findstr "RUNNING" >nul
    if %errorlevel% == 0 (
        echo ✅ MongoDB est déjà démarré !
    ) else (
        echo Démarrage de MongoDB...
        net start MongoDB
        if %errorlevel% == 0 (
            echo ✅ MongoDB démarré avec succès !
        ) else (
            echo ❌ Erreur lors du démarrage de MongoDB.
            echo.
            echo ⚠️  SOLUTION : Exécutez ce fichier en tant qu'administrateur
            echo     Clic droit sur le fichier ^> Exécuter en tant qu'administrateur
            pause
        )
    )
) else (
    echo ❌ Le service MongoDB n'est pas installé.
    echo.
    echo Pour installer MongoDB, exécutez install-mongodb-service.bat en tant qu'administrateur
    pause
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul
