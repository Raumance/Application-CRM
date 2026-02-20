# Configuration Firebase Auth

L'application utilise **Firebase Authentication** pour la connexion (email/mot de passe et Google).

## 1. Activer Firebase Auth

1. Allez sur [Firebase Console](https://console.firebase.google.com/) > projet **CRM-application**
2. **Authentication** > **Sign-in method**
3. Activez :
   - **Email/Password** : activer « E-mail/mot de passe »
   - **Google** : activer et configurer ( Client ID Web peut être généré automatiquement )

## 2. Backend : vérification des tokens

Pour que le backend échange les tokens Firebase contre un JWT CRM, ajoutez dans `.env` :

```
# Option A : Fichier de clé (recommandé)
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Option B : Variables
FIREBASE_PROJECT_ID=crm-application-e8c6c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@crm-application-e8c6c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Voir `CONFIGURATION_FIREBASE_SYNC.md` pour la création du fichier de clé.

## 3. Déployer les règles Firestore

```bash
firebase deploy --only firestore:rules
```

## 4. Flux d'authentification

| Action | Flux |
|--------|------|
| Connexion email | Firebase Auth → token → POST /api/auth/firebase → JWT CRM |
| Connexion Google | signInWithPopup → token → POST /api/auth/firebase → JWT CRM |
| Inscription | createUserWithEmailAndPassword → token → JWT CRM |
| Fallback | Si Firebase échoue (ex : ancien compte), API /api/auth/login classique |

## 5. Accès Firestore côté client

Après connexion via Firebase Auth, le client peut lire/écrire Firestore :

```javascript
import { db, collection, getDocs, onSnapshot } from './firestoreClient'

// Lecture
const snapshot = await getDocs(collection(db, 'prospects'))

// Temps réel
onSnapshot(collection(db, 'prospects'), (snapshot) => {
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
})
```
