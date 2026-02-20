/**
 * Initialisation centralisée de Firebase Admin SDK.
 * Utilisez UNE des options suivantes dans .env :
 *
 * Option 1 (recommandé) - Fichier service account :
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
 *
 * Option 2 - Variable d'environnement Google :
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *
 * Option 3 - Variables individuelles :
 *   FIREBASE_PROJECT_ID=...
 *   FIREBASE_CLIENT_EMAIL=...
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
 */
const path = require('path');

let admin = null;

function getAdmin() {
  if (admin) return admin;
  try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const projectId = process.env.FIREBASE_PROJECT_ID || 'crm-application-e8c6c';
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (serviceAccountPath) {
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else if (clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      } else {
        return null;
      }
    }
    return admin;
  } catch (err) {
    console.warn('Firebase Admin non configuré:', err.message);
    return null;
  }
}

module.exports = { getAdmin };
