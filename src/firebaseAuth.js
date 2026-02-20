/**
 * Vérification des tokens Firebase Auth côté backend
 */
const { getAdmin } = require('./firebaseAdmin');

async function verifyIdToken(idToken) {
  const a = getAdmin();
  if (!a) return null;
  try {
    const decoded = await a.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error('Verify Firebase token:', err.message);
    return null;
  }
}

module.exports = { verifyIdToken, getAdmin };
