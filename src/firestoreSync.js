/**
 * Synchronisation Firestore - écrit les données en double dans MongoDB et Firestore.
 * Si Firebase Admin n'est pas configuré, les appels sont ignorés (sans erreur).
 * Voir src/firebaseAdmin.js pour les options de configuration.
 */
const { getAdmin } = require('./firebaseAdmin');

let db = null;

function getFirestore() {
  if (db !== null) return db;
  if (db === false) return null; // déjà tenté, échec
  try {
    const admin = getAdmin();
    if (!admin) {
      db = false;
      return null;
    }
    db = admin.firestore();
    return db;
  } catch (err) {
    console.warn('Firestore sync désactivé:', err.message);
    db = false;
    return null;
  }
}

function toPlain(doc, excludeKeys = []) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : (doc._doc || doc);
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === '__v' || excludeKeys.includes(k)) continue;
    if (v instanceof Date) out[k] = v;
    else if (v && typeof v === 'object' && v.constructor?.name === 'ObjectId') out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

async function syncCreate(collection, doc, excludeKeys = []) {
  const firestore = getFirestore();
  if (!firestore) return;
  try {
    const data = toPlain(doc, excludeKeys);
    if (data._id) data._id = data._id.toString();
    if (data.id) delete data.id;
    await firestore.collection(collection).doc(doc._id.toString()).set(data);
  } catch (err) {
    console.error(`Firestore sync create ${collection}:`, err.message);
  }
}

async function syncUpdate(collection, id, data) {
  const firestore = getFirestore();
  if (!firestore) return;
  try {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === '_id' || k === '__v') continue;
      if (v && typeof v === 'object' && v.constructor?.name === 'ObjectId') clean[k] = v.toString();
      else clean[k] = v;
    }
    await firestore.collection(collection).doc(id.toString()).update(clean);
  } catch (err) {
    console.error(`Firestore sync update ${collection}:`, err.message);
  }
}

async function syncDelete(collection, id) {
  const firestore = getFirestore();
  if (!firestore) return;
  try {
    await firestore.collection(collection).doc(id.toString()).delete();
  } catch (err) {
    console.error(`Firestore sync delete ${collection}:`, err.message);
  }
}

module.exports = {
  syncCreate,
  syncUpdate,
  syncDelete,
  getFirestore,
};
