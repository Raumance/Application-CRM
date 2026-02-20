/**
 * Script d'initialisation des collections MongoDB
 * Crée la base de données et les collections du CRM si elles n'existent pas.
 *
 * Architecture :
 * - Le backend Express se connecte à MongoDB (MONGODB_URI)
 * - Firebase : Hosting (frontend), Analytics, AI/Gemini
 * - Les données CRM sont stockées dans MongoDB, pas dans Firestore
 *
 * Usage : node scripts/init-mongodb-collections.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Prospect, Tache, Vehicule, Devis, Facture, Interaction, User, RelanceEmail, Banque, ConfigRelance } = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwazplan_crm';

const COLLECTIONS = [
  { name: 'prospects', model: Prospect },
  { name: 'taches', model: Tache },
  { name: 'vehicules', model: Vehicule },
  { name: 'devis', model: Devis },
  { name: 'factures', model: Facture },
  { name: 'interactions', model: Interaction },
  { name: 'users', model: User },
  { name: 'relanceemails', model: RelanceEmail },
  { name: 'banques', model: Banque },
  { name: 'configrelances', model: ConfigRelance },
];

async function createCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name.toLowerCase()));

    for (const { name, model } of COLLECTIONS) {
      const collectionName = model.collection.name;
      if (existingNames.has(collectionName.toLowerCase())) {
        const count = await model.countDocuments();
        console.log(`  📁 ${collectionName} (existe, ${count} document(s))`);
      } else {
        await db.createCollection(collectionName);
        console.log(`  ✨ ${collectionName} créé`);
      }
    }

    console.log('\n✅ Initialisation terminée.');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createCollections();
