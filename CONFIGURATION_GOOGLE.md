# Configuration de la connexion Google

Pour activer "Se connecter avec Google" et "S'inscrire avec Google", suivez ces étapes :

## 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Menu **APIs & Services** > **Credentials** (Identifiants)
4. Cliquez sur **Create Credentials** > **OAuth client ID**

## 2. Configurer l'écran de consentement OAuth

Si demandé, configurez d'abord l'écran de consentement :

1. **OAuth consent screen** > **Edit app**
2. Type d'application : **External** (ou Internal si vous utilisez Google Workspace)
3. Remplissez le nom de l'application : `CRM CarWazPlan`
4. Ajoutez votre email en tant que développeur
5. Scopes : gardez par défaut (`email`, `profile`)
6. Enregistrez

## 3. Créer les identifiants OAuth

1. **Credentials** > **Create Credentials** > **OAuth client ID**
2. Type d'application : **Web application**
3. Nom : `CRM CarWazPlan Web`
4. **Authorized JavaScript origins** : ajoutez :
   - `http://localhost:5173` (développement)
   - `http://localhost:5174` (si le port 5173 est occupé)
   - `https://votre-domaine.com` (production)
5. **Authorized redirect URIs** : ajoutez :
   - `http://localhost:5173/api/auth/google/callback` (développement)
   - `http://localhost:5174/api/auth/google/callback` (si le port 5173 est occupé)
   - `https://votre-domaine.com/api/auth/google/callback` (production)
6. Cliquez sur **Create**
7. Copiez le **Client ID** et le **Client Secret**

## 4. Configurer le fichier .env

Ajoutez ou modifiez ces lignes dans votre fichier `.env` :

```
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
FRONTEND_URL=http://localhost:5173
```

**Important** : Ne commitez jamais le fichier `.env` (il est dans `.gitignore`).

## 5. Redémarrer le serveur

Après avoir modifié `.env` :

```powershell
# Arrêter le serveur (Ctrl+C) puis relancer
npm start
```

## 6. Tester

1. Ouvrez http://localhost:5173
2. Cliquez sur "Se connecter avec Google" ou "S'inscrire avec Google"
3. Sélectionnez votre compte Google
4. Vous serez connecté au CRM

---

## Dépannage

### "Connexion Google non configurée"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont bien définis dans `.env`
- Redémarrez le serveur backend

### "redirect_uri_mismatch"
- Vérifiez que l'URL de callback dans Google Cloud Console correspond exactement à :
  - `http://localhost:5173/api/auth/google/callback` (sans slash final)
- L'URL doit être en http (pas https) pour le développement local

### Connexion internet requise
- La connexion Google nécessite un accès à Internet
- Pour un déploiement en intranet sans Internet, la connexion Google ne fonctionnera pas ; utilisez l'inscription par email/mot de passe
