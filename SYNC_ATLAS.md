# Synchroniser MongoDB local avec MongoDB Atlas

Ce guide permet de **migrer** ou **synchroniser** les données de votre MongoDB local vers MongoDB Atlas.

---

## Prérequis

- MongoDB installé localement (avec `mongodump` et `mongorestore`)
- Compte MongoDB Atlas configuré
- Fichier `.env` avec votre URI Atlas

---

## Méthode 1 : Script automatique (recommandé)

### Étape 1 : Exporter depuis le local

Assurez-vous que MongoDB local est démarré, puis exécutez :

```powershell
# Exporter la base carwazplan_crm vers le dossier backup/
mongodump --uri="mongodb://localhost:27017" --db=carwazplan_crm --out=./backup
```

### Étape 2 : Importer vers Atlas

Remplacez `VOTRE_MOT_DE_PASSE` dans l’URI puis exécutez :

```powershell
mongorestore --uri="mongodb+srv://rnguema288:VOTRE_MOT_DE_PASSE@nguema.dwb0ofa.mongodb.net" --db=carwazplan_crm ./backup/carwazplan_crm
```

### Étape 3 : Basculer l’application sur Atlas

Dans votre fichier `.env` :

```env
MONGODB_URI=mongodb+srv://rnguema288:VOTRE_MOT_DE_PASSE@nguema.dwb0ofa.mongodb.net/carwazplan_crm
```

Puis redémarrez l’application :

```bash
npm start
```

---

## Méthode 2 : Script batch (Windows)

Un script `sync-vers-atlas.bat` est fourni. Exécutez-le après avoir :

1. Renseigné votre mot de passe Atlas dans `.env` (variable `ATLAS_PASSWORD`)
2. Ou modifié le script pour y mettre l’URI complète

---

## Synchronisation régulière

MongoDB ne propose pas de synchronisation automatique bidirectionnelle entre un serveur local et Atlas. Pour garder Atlas à jour :

1. **Utilisation unique d’Atlas** : utilisez uniquement Atlas comme base de données (connexion internet requise).
2. **Synchronisation manuelle** : exécutez le script de migration chaque fois que vous voulez copier les données locales vers Atlas.

---

## Dépannage

### « mongodump n'est pas reconnu »

MongoDB Database Tools doit être installé. Téléchargez-les depuis :
- [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/installation/installation-windows/)
- Ou ajoutez le chemin `C:\Program Files\MongoDB\Server\x.x\bin` à votre PATH

### « Authentication failed » sur Atlas

- Vérifiez le mot de passe (aucun espace avant/après)
- Si le mot de passe contient `@`, `#`, `:`, encodez-les en URL (`%40`, `%23`, `%3A`)

### « IP not whitelisted »

Dans Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`)
