# Configuration Firestore Sync (données MongoDB + Firestore)

Les données CRM sont écrites en **double** dans MongoDB (primaire) et Firestore (secondaire).

## Activation

1. Allez sur [Firebase Console](https://console.firebase.google.com/) > projet **CRM-application**
2. **Paramètres du projet** (engrenage) > **Comptes de service**
3. **Générer une nouvelle clé privée** pour le compte de service `firebase-adminsdk-...`
4. Téléchargez le fichier JSON

### Option A : Fichier de clé (recommandé)

Placez le fichier dans le projet (ex: `serviceAccountKey.json`) et ajoutez dans `.env` :

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

**Important** : Ajoutez `serviceAccountKey.json` à `.gitignore` pour ne pas le commiter.

### Option B : Variables d'environnement

Extrayez du JSON : `project_id`, `client_email`, `private_key` et ajoutez :

```
FIREBASE_PROJECT_ID=crm-application-e8c6c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@crm-application-e8c6c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

(Conservez les `\n` dans la clé privée.)

## Sans configuration

Si aucune des options n'est configurée, la synchronisation Firestore est **désactivée** automatiquement. L'application fonctionne normalement avec MongoDB uniquement.
