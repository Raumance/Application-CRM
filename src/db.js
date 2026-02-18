const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/carwazplan_crm';

async function connectDB() {
  try {
    // Vérifier si déjà connecté
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB déjà connecté');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Augmenté à 10 secondes
    });
    console.log('✅ Connecté à MongoDB:', MONGODB_URI);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    console.error('💡 Vérifiez que MongoDB est bien démarré sur:', MONGODB_URI);
    console.error('💡 Pour démarrer MongoDB localement: mongod');
    throw err; // Relancer l'erreur pour arrêter le serveur si MongoDB n'est pas disponible
  }
}

module.exports = {
  mongoose,
  connectDB,
};
