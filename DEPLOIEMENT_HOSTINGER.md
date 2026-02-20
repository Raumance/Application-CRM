# Hébergement sur Hostinger - CRM CarWazPlan

Guide pour déployer votre CRM sur [Hostinger](https://www.hostinger.fr/) (plans Business ou Cloud).

---

## Prérequis

- Compte Hostinger avec un plan **Business** ou **Cloud** (Node.js requis)
- Dépot GitHub avec le projet (ex: `Raumance/Application-CRM`)
- MongoDB Atlas configuré (la base de données sera sur Atlas, pas Hostinger)

---

## Étape 1 : Préparer le dépôt GitHub

Assurez-vous que votre code est poussé sur GitHub :

```bash
git add .
git commit -m "Préparation déploiement Hostinger"
git push origin master
```

---

## Étape 2 : Créer l’application Node.js sur Hostinger

1. Connectez-vous à **hPanel** Hostinger
2. Allez dans **Websites** → **Add Website**
3. Choisissez **Node.js Apps**
4. Sélectionnez **Import Git Repository**
5. Autorisez l’accès GitHub et choisissez le dépôt `Application-CRM` (ou votre dépôt)

---

## Étape 3 : Paramètres de build

Hostinger détecte souvent les paramètres automatiquement. S’il faut les renseigner manuellement :

| Paramètre | Valeur |
|-----------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Node.js Version** | 20.x (recommandé) |

---

## Étape 4 : Variables d’environnement

Dans la section **Environment Variables** du déploiement, ajoutez :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://rnguema288:VOTRE_MOT_DE_PASSE@nguema.dwb0ofa.mongodb.net/carwazplan_crm?appName=Nguema` |
| `JWT_SECRET` | Une clé secrète longue (ex: 64 caractères aléatoires) |
| `FRONTEND_URL` | L’URL de votre site une fois déployé (ex: `https://votre-site.hostinger.site`) |

**Important :** remplacez `VOTRE_MOT_DE_PASSE` par votre mot de passe MongoDB Atlas.

---

## Étape 5 : Déployer

Cliquez sur **Deploy**. Le premier déploiement peut prendre quelques minutes.

Votre CRM sera accessible sur un sous-domaine Hostinger (ex: `votre-app.hostinger.site`).

---

## Étape 6 : Domaine personnalisé (optionnel)

Pour utiliser votre propre domaine (ex: `crm.votreentreprise.com`) :

1. Une fois le déploiement terminé, allez dans **Settings** du site
2. Suivez le guide Hostinger : [Connecter un domaine personnalisé](https://www.hostinger.com/support/10085905-how-to-connect-a-preferred-domain-name-instead-of-a-temporary-one-at-hostinger/)

---

## Mises à jour

### Déploiement via GitHub

Chaque push sur la branche configurée déclenche un nouveau déploiement.

### Changement des variables d’environnement

1. **Websites** → votre site → **Deployments**
2. Cliquez sur **Settings & Redeploy**
3. Modifiez les variables et redéployez

---

## Dépannage

### Le déploiement échoue

- Vérifiez les logs de build dans **Deployments** → **See details**
- Vérifiez que `npm run build` fonctionne en local : `npm run build`
- Vérifiez que le dossier `client/dist` est créé après le build

### Erreur de connexion MongoDB

- Vérifiez que `MONGODB_URI` est correct (sans espaces)
- Vérifiez que l’IP de Hostinger est autorisée sur Atlas : **Network Access** → **Add IP** → **Allow access from anywhere** (`0.0.0.0/0`)

### La page reste blanche

- Vérifiez que le build a bien créé `client/dist`
- Vérifiez que `FRONTEND_URL` correspond à l’URL réelle du site
