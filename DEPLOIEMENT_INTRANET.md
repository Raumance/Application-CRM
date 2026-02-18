# Guide de déploiement intranet - CRM CarWazPlan

Ce guide explique comment déployer le CRM en intranet (sans connexion internet) et faire tourner le serveur en permanence.

## 📋 Prérequis

1. **MongoDB** installé et configuré comme service Windows
2. **Node.js** installé (version 16 ou supérieure)
3. **PM2** installé globalement (déjà fait avec `npm install -g pm2`)

## 🚀 Installation

### 1. Installer MongoDB comme service Windows

```bash
# Dans un terminal administrateur
mongod --install --serviceName "MongoDB" --serviceDisplayName "MongoDB" --dbpath "C:\data\db"
net start MongoDB
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/carwazplan_crm
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe-changez-moi
```

### 3. Installer les dépendances

```bash
npm install
cd client
npm install
cd ..
```

## 🔧 Démarrage du serveur

### Méthode 1 : Script batch (recommandé pour Windows)

Double-cliquez sur `start-server.bat` ou exécutez dans un terminal :

```bash
start-server.bat
```

### Méthode 2 : Commande PM2 directe

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

La commande `pm2 startup` créera un service Windows qui démarrera automatiquement PM2 au démarrage de l'ordinateur.

## 📊 Gestion du serveur

### Commandes PM2 utiles

```bash
# Voir le statut
pm2 status

# Voir les logs en temps réel
pm2 logs crm-carwazplan-backend

# Redémarrer le serveur
pm2 restart crm-carwazplan-backend

# Arrêter le serveur
pm2 stop crm-carwazplan-backend

# Arrêter et supprimer
pm2 delete crm-carwazplan-backend
```

### Arrêter le serveur

Double-cliquez sur `stop-server.bat` ou :

```bash
pm2 stop crm-carwazplan-backend
pm2 delete crm-carwazplan-backend
```

## 🌐 Accès au CRM

Une fois le serveur démarré :

- **Backend API** : `http://localhost:4000`
- **Frontend** : Lancez le client React (`cd client && npm run dev`) puis accédez à l'URL affichée (généralement `http://localhost:5173`)

### Pour un accès réseau (intranet)

Si vous voulez accéder depuis d'autres machines du réseau :

1. **Backend** : Modifiez `ecosystem.config.js` pour écouter sur `0.0.0.0` au lieu de `localhost`
2. **Frontend** : Modifiez `client/src/App.jsx` pour remplacer `http://localhost:4000` par l'IP du serveur (ex: `http://192.168.1.100:4000`)
3. **Firewall Windows** : Autorisez les ports 4000 (backend) et 5173 (frontend) dans le pare-feu

## 🔒 Sécurité

- Changez le `JWT_SECRET` dans `.env` par une clé secrète longue et complexe
- Configurez le pare-feu pour limiter l'accès au réseau interne uniquement
- Utilisez HTTPS en production (certificat SSL auto-signé pour intranet)

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que MongoDB est démarré : `net start MongoDB`
2. Vérifiez les logs : `pm2 logs crm-carwazplan-backend`
3. Vérifiez le fichier `.env` existe et contient les bonnes valeurs

### MongoDB ne démarre pas

1. Vérifiez que le service MongoDB est démarré dans les Services Windows
2. Vérifiez que le dossier `C:\data\db` existe et a les bonnes permissions

### Le frontend ne peut pas joindre le backend

1. Vérifiez que le backend tourne : `pm2 status`
2. Testez l'API : Ouvrez `http://localhost:4000/api/health` dans un navigateur
3. Vérifiez l'URL dans `client/src/App.jsx` (doit être `http://localhost:4000`)

## 📝 Notes importantes

- **Tout fonctionne en local** : MongoDB, backend et frontend sont tous sur la même machine
- **Pas besoin d'internet** : Toutes les dépendances sont installées localement
- **Le serveur redémarre automatiquement** en cas de crash grâce à PM2
- **Les logs sont sauvegardés** dans le dossier `logs/`
