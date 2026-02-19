# 🌐 Hébergement en ligne - CRM CarWazPlan

Ce guide vous permet d'héberger votre CRM sur Internet pour que vos équipes y accèdent **depuis le bureau ou depuis la maison**.

---

## 📋 Vue d'ensemble

| Composant | Besoin |
|-----------|--------|
| **Base de données** | MongoDB Atlas (gratuit) |
| **Application** | Render.com, Railway ou VPS |
| **Domain personnalisé** | Optionnel (ex: crm.votreentreprise.com) |

---

## Option 1 : Render.com (Recommandé - Gratuit pour démarrer)

Render propose un hébergement gratuit pour démarrer. L'application "s'endort" après 15 min d'inactivité et reprend en ~30 secondes au premier accès.

### Étape 1 : Créer la base MongoDB Atlas (gratuit)

1. Allez sur [mongodb.com/atlas](https://www.mongodb.com/atlas) et créez un compte
2. Créez un cluster gratuit (M0)
3. **Database Access** → Add User → Créez un utilisateur (notez le mot de passe)
4. **Network Access** → Add IP → Allow access from anywhere (`0.0.0.0/0`)
5. **Connect** → Drivers → Copiez la chaîne de connexion, par ex. :
   ```
   mongodb+srv://utilisateur:motdepasse@cluster0.xxxxx.mongodb.net/carwazplan_crm
   ```

### Étape 2 : Déployer sur Render

1. Allez sur [render.com](https://render.com) et connectez-vous avec GitHub
2. **New** → **Web Service**
3. Connectez le dépôt `Raumance/Application-CRM`
4. Configurez :
   - **Name** : `crm-carwazplan`
   - **Region** : Frankfurt (plus proche de la France)
   - **Runtime** : Node
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Instance Type** : Free

5. **Environment Variables** (à ajouter) :

   | Variable | Valeur |
   |----------|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `MONGODB_URI` | `mongodb+srv://...` (votre URI Atlas) |
   | `JWT_SECRET` | Une clé secrète longue et aléatoire (ex: 64 caractères) |
   | `FRONTEND_URL` | `https://votre-app.onrender.com` (l'URL Render de l'app) |

6. Cliquez sur **Create Web Service**
7. Attendez le premier déploiement (~5 min)
8. Votre CRM sera accessible à : `https://crm-carwazplan.onrender.com` (ou l'URL affichée)

### Premier utilisateur

Au premier accès, **inscrivez-vous** depuis la page de connexion pour créer le compte administrateur.

---

## Option 2 : Railway (Sans veille - ~5 €/mois)

Railway ne met pas l'application en veille. Idéal si votre équipe utilise le CRM toute la journée.

1. [railway.app](https://railway.app) → Connectez GitHub
2. **New Project** → **Deploy from GitHub** → Sélectionnez `Application-CRM`
3. Railway détecte Node.js automatiquement
4. Ajoutez les variables d'environnement (comme pour Render)
5. **Settings** → **Generate Domain** pour obtenir une URL HTTPS
6. Pour MongoDB : utilisez MongoDB Atlas (même configuration qu'option 1)

---

## Option 3 : Accès distant sans hébergement cloud

Si vous avez déjà un PC/serveur au bureau qui tourne le CRM en réseau local, vous pouvez le rendre accessible depuis Internet **sans changer de serveur**.

### Option 3a : Cloudflare Tunnel (Gratuit, sécurisé)

1. Installez [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
2. Sur la machine qui héberge le CRM :
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
3. Cloudflare vous donne une URL temporaire (ex: `https://xxx.trycloudflare.com`)
4. Vos équipes accèdent au CRM via cette URL
5. Pour une URL fixe : créez un compte Cloudflare et configurez un tunnel nommé

### Option 3b : ngrok (Simple pour tester)

1. Créez un compte sur [ngrok.com](https://ngrok.com)
2. `ngrok http 4000`
3. Une URL de type `https://xxxx.ngrok-free.app` est générée
4. Version gratuite : l'URL change à chaque redémarrage

---

## Option 4 : VPS (Contrôle total)

Si vous préférez un serveur dédié (OVH, DigitalOcean, Scaleway, etc.) :

1. Créez une machine Ubuntu
2. Installez Node.js, MongoDB (ou connectez MongoDB Atlas)
3. Clonez le dépôt, configurez `.env`, exécutez `npm run build && npm start`
4. Utilisez **PM2** pour faire tourner l'app en continu : `pm2 start ecosystem.config.js`
5. Optionnel : Nginx en reverse proxy + certificat Let's Encrypt pour HTTPS

---

## 🔒 Sécurité

- **JWT_SECRET** : Générez une clé forte (`openssl rand -base64 48` ou un générateur en ligne)
- **MongoDB Atlas** : En production, limitez les IP autorisées aux seules plateformes d'hébergement
- **HTTPS** : Render, Railway et Cloudflare fournissent HTTPS automatiquement

---

## 🐛 Dépannage

### "Cannot connect to MongoDB"
- Vérifiez que `MONGODB_URI` est correct et que l'IP `0.0.0.0/0` est autorisée dans Atlas
- Vérifiez le mot de passe (caractères spéciaux peuvent nécessiter un encodage URL)

### "Application failed to respond"
- Sur Render : attendez 30-60 secondes après une période d'inactivité (veille)
- Vérifiez les logs dans le dashboard Render/Railway

### La page reste blanche
- Vérifiez que `npm run build` s'est exécuté correctement (dossier `client/dist` créé)
- Vérifiez que `FRONTEND_URL` correspond à l'URL réelle de l'application
