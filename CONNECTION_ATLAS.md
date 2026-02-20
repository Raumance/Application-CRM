# Connexion à MongoDB Atlas

Ce guide explique comment connecter votre application au cluster MongoDB Atlas.

## 1. Récupérer l'URI de connexion

1. Allez sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre cluster (ex: `nguema`)
4. Cliquez sur **Connect** → **Drivers** → copiez la chaîne de connexion

Format :
```
mongodb+srv://rnguema288:<password>@nguema.dwb0ofa.mongodb.net/
```

## 2. Configurer l'application

Créez un fichier `.env` à la racine du projet (ou modifiez l'existant) :

```env
MONGODB_URI=mongodb+srv://rnguema288:VOTRE_MOT_DE_PASSE@nguema.dwb0ofa.mongodb.net/carwazplan_crm
```

**Important :**
- Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe de votre utilisateur Atlas
- Si le mot de passe contient `@`, `#`, `:`, encodez-les en URL :
  - `@` → `%40`
  - `#` → `%23`
  - `:` → `%3A`

## 3. Autoriser les adresses IP (Atlas)

Dans MongoDB Atlas → **Network Access** → **Add IP Address** :
- Pour développement : **Allow access from anywhere** (`0.0.0.0/0`)
- Pour production : ajoutez les IP de votre serveur uniquement

## 4. Démarrer l'application

```bash
npm start
```

Ou avec PM2 :
```bash
# MONGODB_URI est lu depuis .env par dotenv
pm2 start ecosystem.config.js
```

La base `carwazplan_crm` et les collections seront créées automatiquement au premier démarrage.
