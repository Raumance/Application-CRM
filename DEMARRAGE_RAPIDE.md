# 🚀 Guide de Démarrage Rapide - CRM CarWazPlan

## ⚠️ Problème : "Accès refusé" lors du démarrage de MongoDB

Si vous obtenez l'erreur **"Accès refusé"** ou **"System error 5"**, c'est que vous n'avez pas les droits administrateur.

---

## ✅ Solution 1 : Démarrer MongoDB en tant qu'administrateur

### Option A : Via PowerShell (Recommandé)

1. **Fermez votre PowerShell actuel**

2. **Ouvrez PowerShell en tant qu'administrateur** :
   - Appuyez sur `Windows + X`
   - Cliquez sur **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
   - Confirmez avec "Oui" si Windows demande la permission

3. **Naviguez vers le dossier du projet** :
   ```powershell
   cd C:\Users\LENOVO\mon-site-web
   ```

4. **Démarrez MongoDB** :
   ```powershell
   net start MongoDB
   ```

### Option B : Via le script batch (Plus simple)

1. **Clic droit** sur le fichier `start-mongodb.bat`
2. Sélectionnez **"Exécuter en tant qu'administrateur"**
3. Confirmez avec "Oui"

---

## ✅ Solution 2 : Vérifier si MongoDB est déjà démarré

Parfois MongoDB est déjà démarré ! Vérifiez avec :

```powershell
Get-Service -Name MongoDB
```

Si le statut est **"Running"**, MongoDB est déjà démarré et vous pouvez continuer !

---

## 📋 Étapes Complètes pour Tester le Site

### 1. Démarrer MongoDB (si pas déjà démarré)

**En PowerShell Admin** :
```powershell
net start MongoDB
```

**OU utilisez le script** :
- Clic droit sur `start-mongodb.bat` > Exécuter en tant qu'administrateur

### 2. Démarrer le Backend

Dans un terminal normal (pas besoin d'admin) :
```powershell
cd C:\Users\LENOVO\mon-site-web
npm start
```

Vous devriez voir :
```
✅ Connecté à MongoDB: mongodb://localhost:27017/carwazplan_crm
Serveur démarré sur http://localhost:4000
```

### 3. Démarrer le Frontend

Dans un **nouveau terminal** :
```powershell
cd C:\Users\LENOVO\mon-site-web\client
npm run dev
```

Vous devriez voir :
```
VITE v7.3.1  ready in XXXX ms
➜  Local:   http://localhost:5173/
```

### 4. Ouvrir le Site

Ouvrez votre navigateur et allez sur : **http://localhost:5173**

---

## 🔧 Dépannage

### MongoDB ne démarre pas

1. **Vérifiez que MongoDB est installé** :
   ```powershell
   Get-Service -Name MongoDB
   ```

2. **Si le service n'existe pas**, installez-le :
   - Clic droit sur `install-mongodb-service.bat` > Exécuter en tant qu'administrateur

3. **Vérifiez les logs MongoDB** :
   - Regardez dans `C:\data\db\mongod.log` pour voir les erreurs

### Le backend ne se connecte pas à MongoDB

1. Vérifiez que MongoDB est bien démarré :
   ```powershell
   Get-Service -Name MongoDB | Select-Object Status
   ```

2. Vérifiez que le port 27017 est libre :
   ```powershell
   netstat -an | findstr 27017
   ```

### Le frontend ne se charge pas

1. Vérifiez que le backend est démarré sur le port 4000
2. Vérifiez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que vous êtes bien sur `http://localhost:5173` (pas `https`)

---

## 📝 Commandes Utiles

### Vérifier le statut de MongoDB
```powershell
Get-Service -Name MongoDB
```

### Démarrer MongoDB
```powershell
net start MongoDB
```

### Arrêter MongoDB
```powershell
net stop MongoDB
```

### Vérifier que le backend répond
```powershell
Invoke-WebRequest -Uri http://localhost:4000/api/health -UseBasicParsing
```

---

## 🎯 Résumé

1. ✅ **MongoDB démarré** (nécessite droits admin)
2. ✅ **Backend démarré** sur http://localhost:4000
3. ✅ **Frontend démarré** sur http://localhost:5173
4. ✅ **Site accessible** sur http://localhost:5173

**Bon test ! 🚀**
