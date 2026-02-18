# Déploiement sur le réseau de l'entreprise

Ce guide explique comment déployer le CRM CarWazPlan pour qu’il soit accessible depuis tous les postes du réseau de l’entreprise.

---

## Méthode rapide (recommandée)

### 1. Sur la machine serveur (une seule machine)

1. **Ouvrir un terminal** dans le dossier du projet.
2. **Construire le frontend** :
   ```bash
   npm run build
   ```
3. **Lancer le CRM** :
   - Double-cliquez sur `LANCER_RESEAU.bat`
   - Ou en ligne de commande :
   ```bash
   set NODE_ENV=production
   set HOST=0.0.0.0
   npm start
   ```

### 2. Autoriser le pare-feu Windows (port 4000)

Sur la machine serveur, exécutez **en tant qu’administrateur** :

```powershell
netsh advfirewall firewall add rule name="CRM CarWazPlan" dir=in action=allow protocol=tcp localport=4000
```

Ou via l’interface : **Panneau de configuration** → **Pare-feu Windows** → **Paramètres avancés** → **Règles de trafic entrant** → **Nouvelle règle** → Port → TCP 4000 → Autoriser.

### 3. Connaître l’adresse IP du serveur

Sur la machine serveur, exécutez :

```bash
ipconfig
```

Repérez l’**IPv4** (ex. `192.168.1.50`).

### 4. Accès depuis les autres postes

Sur n’importe quel ordinateur du réseau, ouvrez un navigateur et allez à :

```
http://192.168.1.50:4000
```

(Remplacez par l’IP réelle du serveur.)

---

## Méthode PM2 (démarrage au boot)

Pour que le CRM démarre automatiquement au démarrage de la machine :

1. **Construire le frontend** :
   ```bash
   npm run build
   ```

2. **Lancer avec PM2** :
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. Suivre les étapes 2 et 3 ci-dessus (pare-feu et IP).

---

## Prérequis

- **MongoDB** installé et démarré sur la machine serveur.
- **Node.js** (v16 ou plus) installé sur la machine serveur.
- Les postes clients n’ont besoin que d’un navigateur web.

---

## Vérifications

| Vérification | Commande / Test |
|-------------|------------------|
| MongoDB tourne | `net start MongoDB` ou vérifier dans les Services Windows |
| Backend répond | Ouvrir `http://localhost:4000/api/health` sur le serveur |
| Accès réseau | Depuis un autre PC : `http://<IP-SERVEUR>:4000` |
| Build présent | Le dossier `client/dist` doit exister |

---

## Dépannage

### « Impossible d’accéder au site depuis un autre PC »

1. Vérifier que le pare-feu autorise le port 4000.
2. Tester avec `ping <IP-SERVEUR>` depuis un autre poste.
3. Vérifier que les postes sont sur le même réseau (même VLAN/sous-réseau).

### « Le site ne charge pas »

1. Vérifier que le build existe : `client/dist/index.html`.
2. Si besoin, relancer : `npm run build` puis `npm start`.

### « MongoDB ne démarre pas »

1. Vérifier que le service MongoDB est démarré dans les Services Windows.
2. Vérifier le chemin des données MongoDB dans le fichier `.env`.
