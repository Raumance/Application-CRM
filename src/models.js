const { mongoose } = require('./db');

const prospectSchema = new mongoose.Schema(
  {
    idContact: String,
    nom: String,
    prenom: String,
    email: String,
    telephone: String,
    ville: String,
    segment: String,
    statut: String,
    revenuMensuel: Number,
    typeVehicule: String,
    budgetClient: Number,
    apportInitial: Number,
    dureeFinancement: Number,
    statutDossier: String,
    scoreEligibilite: Number,
    prochaineRelance: Date,
    priorite: String,
    banqueSoumise: String,
  },
  { timestamps: true }
);

const banqueSchema = new mongoose.Schema(
  {
    nom: String,
    tauxMin: Number,
    tauxMax: Number,
    apportMinPourcent: Number,
    dureeMaxMois: Number,
  },
  { timestamps: true }
);

const configRelanceSchema = new mongoose.Schema(
  {
    statutDossier: String,
    delaiJours: Number,
    priorite: String,
    canal: String,
  },
  { timestamps: true }
);

const tacheSchema = new mongoose.Schema(
  {
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
    commercial: String,
    description: String,
    echeance: Date,
    statut: String,
  },
  { timestamps: true }
);

const vehiculeSchema = new mongoose.Schema(
  {
    marque: String,
    modele: String,
    annee: Number,
    prix: Number,
    statut: String,
    localisation: String,
  },
  { timestamps: true }
);

const devisSchema = new mongoose.Schema(
  {
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
    numero: String,
    client: String,
    vehicule: String,
    montant: Number,
    statut: String,
    // Devis complet (inspiré CARWAZPLAN LE BON WAZ)
    clientEntreprise: String,
    clientResponsable: String,
    clientTelephone: String,
    clientEmail: String,
    objet: String, // ex: "Leasing intégral ALL-INCLUSIVE – CHANGAN X5 PLUS"
    premierLoyer: Number, // 1er loyer majoré / Apport (FCFA)
    mensualiteFixe: Number, // Mensualité fixe (FCFA)
    dureeMois: Number,
    optionAchat: Number, // Option d'achat à l'échéance (FCFA)
    inclus: [String], // Liste des éléments inclus
    conditions: [String], // Conditions contractuelles
    tvaTaux: Number, // Taux TVA en % (ex: 18)
    montantHT: Number, // Montant hors taxes (FCFA)
    tvaMontant: Number, // Montant TVA (FCFA)
    montantTTC: Number, // Montant TTC (FCFA)
  },
  { timestamps: true }
);

const factureSchema = new mongoose.Schema(
  {
    numero: String,
    devisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Devis' },
    client: String,
    montant: Number,
    statut: String,
    dateEmission: Date,
    dateEcheance: Date,
  },
  { timestamps: true }
);

const interactionSchema = new mongoose.Schema(
  {
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
    date: Date,
    type: String,
    sujet: String,
    contenu: String,
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: false }, // Optionnel pour utilisateurs Google
    googleId: { type: String, unique: true, sparse: true },
    firebaseUid: { type: String, unique: true, sparse: true },
    nom: { type: String },
    prenom: { type: String },
    departement: { type: String },
    profileImage: { type: String }, // URL ou base64 de la photo de profil
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    fcmTokens: [{ type: String }], // Tokens pour notifications push
  },
  { timestamps: true }
);

const relanceEmailSchema = new mongoose.Schema(
  {
    nom: String,
    sujet: String,
    corps: String,
    sequence: Number, // Ordre dans la séquence de relance
  },
  { timestamps: true }
);

const Prospect = mongoose.model('Prospect', prospectSchema);
const Banque = mongoose.model('Banque', banqueSchema);
const ConfigRelance = mongoose.model('ConfigRelance', configRelanceSchema);
const Tache = mongoose.model('Tache', tacheSchema);
const Vehicule = mongoose.model('Vehicule', vehiculeSchema);
const Devis = mongoose.model('Devis', devisSchema);
const Facture = mongoose.model('Facture', factureSchema);
const Interaction = mongoose.model('Interaction', interactionSchema);
const User = mongoose.model('User', userSchema);
const RelanceEmail = mongoose.model('RelanceEmail', relanceEmailSchema);

module.exports = {
  Prospect,
  Banque,
  ConfigRelance,
  Tache,
  Vehicule,
  Devis,
  Facture,
  Interaction,
  User,
  RelanceEmail,
};

