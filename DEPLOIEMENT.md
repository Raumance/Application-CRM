# Déploiement CRM CarWazPlan

## 1. Vérifier l'authentification avant déploiement

### Démarrer le backend (Terminal 1)
```bash
npm start
```

### Lancer la vérification (Terminal 2)
```bash
npm run verify:auth
```

Le script teste :
- Endpoint /api/health
- Login par email/mot de passe (validation format)
- Redirection Google OAuth

### Tester manuellement
1. Ouvrir http://localhost:5173
2. **Inscription** : créer un compte (email + mot de passe)
3. **Connexion** : se connecter avec ce compte
4. **Google** (si configuré) : cliquer sur "Se connecter avec Google"

---

## 2. Build et déploiement Firebase Hosting

### Build du frontend
```bash
npm run build
```

### Déploiement sur Firebase
```bash
firebase deploy --only hosting
```

### Canal de prévisualisation (test avant prod)
```bash
firebase hosting:channel:deploy preview_name
```

---

## 3. Configuration pour la production

### Frontend déployé sur Firebase
L'URL sera du type : `https://crm-application-e8c6c-d3bf3.web.app`

### Backend
Le frontend doit pouvoir joindre le backend. Options :

**Option A - Même serveur** : Si le backend est sur un domaine (ex: Render), configurez :
- Variable d'environnement à la build : `VITE_API_URL=https://votre-backend.onrender.com`
- Puis `npm run build` et `firebase deploy`

**Option B - Déploiement réseau local** : Le script `npm start` sert le frontend compilé depuis `client/dist` si `NODE_ENV=production`. Accès via `http://<IP-SERVEUR>:4000`

---

## 4. Tester en ligne (production)

### Option A – Render.com (recommandé, une seule URL)

Le backend sert aussi le frontend. Tout est accessible sur une URL du type `https://crm-carwazplan.onrender.com`.

1. **Connecter le dépôt** à [Render](https://render.com) et déployer avec `render.yaml`.
2. **Variables d'environnement** dans le Dashboard Render :
   - `MONGODB_URI` : URI MongoDB Atlas (obligatoire)
   - `JWT_SECRET` : clé secrète (`openssl rand -base64 48`)
   - `FRONTEND_URL` : l’URL Render (ex: `https://crm-carwazplan.onrender.com`)
   - `FIREBASE_CLIENT_EMAIL` : email du compte de service Firebase (dans `serviceAccountKey.json`)
   - `FIREBASE_PRIVATE_KEY` : clé privée Firebase (sans les guillemets, conserver les `\n`)

3. **Firebase Console** → Authentification → Paramètres → Domaines autorisés : ajouter l’URL Render.
4. Tester sur l’URL fournie par Render.

### Option B – Firebase Hosting (frontend) + backend séparé

1. Déployer le backend sur Render (ou autre hébergeur).
2. Build du frontend avec l’URL du backend :
   ```bash
   VITE_API_URL=https://votre-backend.onrender.com npm run build
   ```
3. Déployer sur Firebase :
   ```bash
   firebase deploy --only hosting
   ```
4. Tester sur `https://crm-application-e8c6c-d3bf3.web.app`.
