require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.'));
    }
  },
});
const { Prospect, Tache, Vehicule, Devis, Facture, Interaction, User, RelanceEmail, Banque, ConfigRelance } = require('./models');
const { generateDevisPDF } = require('./generateDevisPdf');

// Scoring éligibilité (cahier des charges - 0 à 100)
function calculerScoreEligibilite(revenu, apport, budget, duree) {
  let score = 0;
  if (!revenu || !budget || !duree) return 0;
  const mensualite = budget / duree;
  const tauxEndettement = mensualite / revenu;
  if (tauxEndettement <= 0.33) score += 40;
  if (apport && budget && apport / budget >= 0.2) score += 30;
  if (duree <= 48) score += 20;
  if (revenu >= 500000) score += 10;
  return Math.min(100, score);
}

// Priorité selon score
function calculerPriorite(score) {
  if (score >= 70) return 'Haute';
  if (score >= 40) return 'Moyenne';
  return 'Basse';
}

// Prochaine date de relance selon config (Statut -> Délai J jours)
async function calculerProchaineRelance(statutDossier) {
  const config = await ConfigRelance.findOne({ statutDossier }).lean();
  const jours = config?.delaiJours ?? 3;
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d;
}

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Helper : détecte l'URL du frontend (proxy peut changer le port)
function getFrontendUrl(req) {
  const origin = req.get('Origin') || req.get('Referer');
  if (origin) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch (_) {}
  }
  return FRONTEND_URL;
}

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' })); // Permet les images base64 pour la photo de profil

// Middleware d'authentification simple (lecture du token JWT)
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// Validation email (format valide)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Utilisateur déjà existant.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
    });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé' });
  } catch (err) {
    console.error('Erreur /api/auth/register', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création utilisateur.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({ error: 'Ce compte utilise la connexion Google. Utilisez "Se connecter avec Google".' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, email: user.email, role: user.role, profileImage: user.profileImage });
  } catch (err) {
    console.error('Erreur /api/auth/login', err);
    res.status(500).json({ error: "Erreur serveur lors de l'authentification." });
  }
});

// Profil de l'utilisateur connecté
app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erreur /api/auth/me', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.put('/api/auth/me', authRequired, async (req, res) => {
  try {
    const { profileImage, nom, prenom, departement } = req.body;
    const update = {};
    if (profileImage !== undefined) update.profileImage = profileImage || null;
    if (nom !== undefined) update.nom = (nom || '').trim() || null;
    if (prenom !== undefined) update.prenom = (prenom || '').trim() || null;
    if (departement !== undefined) update.departement = (departement || '').trim() || null;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      update,
      { new: true }
    ).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erreur PUT /api/auth/me', err);
    res.status(500).json({ error: err.message || 'Erreur serveur lors de la mise à jour.' });
  }
});

// Gestion erreurs Multer (fichier trop gros, mauvais format, etc.)
function handleUploadError(err, req, res, next) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image trop grande. Maximum 1 Mo.' });
    }
    return res.status(400).json({ error: err.message || 'Erreur lors de l\'upload.' });
  }
  next();
}

// Upload photo de profil (multipart/form-data - plus fiable)
app.post('/api/auth/me/photo', authRequired, upload.single('photo'), handleUploadError, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage: base64 },
      { new: true }
    ).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erreur POST /api/auth/me/photo', err);
    res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
});

// Google OAuth - Redirection vers Google (redirect_uri pointe vers le frontend, le proxy achemine vers le backend)
app.get('/api/auth/google', (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${frontendUrl}?error=google_config`);
  }
  const redirectUri = `${frontendUrl}/api/auth/google/callback`;
  const scopes = ['email', 'profile'].map(s => `https://www.googleapis.com/auth/userinfo.${s}`).join(' ');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  res.redirect(url.toString());
});

// Google OAuth - Callback et création/connexion utilisateur
app.get('/api/auth/google/callback', async (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  try {
    const { code } = req.query;
    if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}?error=google_config`);
    }

    const redirectUri = `${frontendUrl}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error('Google token error:', tokenData);
      return res.redirect(`${frontendUrl}?error=google_token`);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}?error=google_email`);
    }

    const email = googleUser.email.toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId: googleUser.id }, { email }] });
    if (!user) {
      const parts = (googleUser.name || '').trim().split(/\s+/);
      const prenom = parts[0] || null;
      const nom = parts.slice(1).join(' ') || null;
      user = new User({
        email,
        googleId: googleUser.id,
        nom,
        prenom,
        role: 'user',
      });
      await user.save();
    } else {
      if (!user.googleId) {
        user.googleId = googleUser.id;
        await user.save();
      }
      if (googleUser.name && (!user.nom || !user.prenom)) {
        const parts = googleUser.name.trim().split(/\s+/);
        user.prenom = user.prenom || parts[0] || null;
        user.nom = user.nom || (parts.slice(1).join(' ') || null);
        await user.save();
      }
    }
    if (googleUser.picture && !user.profileImage) {
      user.profileImage = googleUser.picture;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.redirect(`${frontendUrl}?token=${token}`);
  } catch (err) {
    console.error('Erreur /api/auth/google/callback', err);
    res.redirect(`${frontendUrl}?error=google_error`);
  }
});

// Routes API CRM (protégées)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Node.js/Express opérationnel.' });
});

// Prospects / Clients
app.get('/api/prospects', authRequired, async (req, res) => {
  const items = await Prospect.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post('/api/prospects', authRequired, async (req, res) => {
  try {
    const {
      nom, prenom, email, telephone, segment, statut,
      ville, revenuMensuel, typeVehicule, budgetClient, apportInitial, dureeFinancement, statutDossier,
    } = req.body;

    const nomComplet = [prenom, nom].filter(Boolean).join(' ').trim();
    if (!nomComplet) {
      return res.status(400).json({ error: 'Nom complet est obligatoire.' });
    }

    const count = await Prospect.countDocuments();
    const idContact = `CW-${String(count + 1).padStart(4, '0')}`;

    const revenu = Number(revenuMensuel) || 0;
    const apport = Number(apportInitial) || 0;
    const budget = Number(budgetClient) || 0;
    const duree = Number(dureeFinancement) || 36;
    const score = calculerScoreEligibilite(revenu, apport, budget, duree);
    const priorite = calculerPriorite(score);
    const stDossier = statutDossier || 'Nouveau Contact';
    const prochaineRelance = await calculerProchaineRelance(stDossier);

    const prospect = new Prospect({
      idContact,
      nom,
      prenom,
      email,
      telephone,
      ville,
      segment,
      statut: statut || 'Prospect',
      revenuMensuel: revenu,
      typeVehicule: typeVehicule || 'Neuf',
      budgetClient: budget,
      apportInitial: apport,
      dureeFinancement: duree,
      statutDossier: stDossier,
      scoreEligibilite: score,
      prochaineRelance,
      priorite,
    });

    const saved = await prospect.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/prospects', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du prospect.' });
  }
});

app.put('/api/prospects/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const current = await Prospect.findById(id).lean();
    if (!current) return res.status(404).json({ error: 'Prospect introuvable.' });

    const revenu = Number(update.revenuMensuel ?? current.revenuMensuel) || 0;
    const apport = Number(update.apportInitial ?? current.apportInitial) || 0;
    const budget = Number(update.budgetClient ?? current.budgetClient) || 0;
    const duree = Number(update.dureeFinancement ?? current.dureeFinancement) || 36;
    const stDossier = update.statutDossier ?? current.statutDossier;

    update.scoreEligibilite = calculerScoreEligibilite(revenu, apport, budget, duree);
    update.priorite = calculerPriorite(update.scoreEligibilite);
    update.prochaineRelance = await calculerProchaineRelance(stDossier);

    const updated = await Prospect.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/prospects/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/prospects/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Prospect.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Prospect introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/prospects/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Interactions
app.get('/api/interactions', authRequired, async (req, res) => {
  const items = await Interaction.find().sort({ date: -1 }).lean();
  res.json(items);
});

app.post('/api/interactions', authRequired, async (req, res) => {
  try {
    const { prospectId, date, type, sujet, contenu } = req.body;

    if (!type || !sujet) {
      return res.status(400).json({ error: 'Type et sujet sont obligatoires.' });
    }

    const interaction = new Interaction({
      prospectId: prospectId || undefined,
      date: date ? new Date(date) : new Date(),
      type,
      sujet,
      contenu,
    });

    const saved = await interaction.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/interactions', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'interaction.' });
  }
});

app.put('/api/interactions/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.date) {
      update.date = new Date(update.date);
    }
    const updated = await Interaction.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Interaction introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/interactions/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/interactions/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Interaction.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Interaction introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/interactions/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Tâches
app.get('/api/taches', authRequired, async (req, res) => {
  const items = await Tache.find().sort({ echeance: 1 }).lean();
  res.json(items);
});

app.post('/api/taches', authRequired, async (req, res) => {
  try {
    const { prospectId, commercial, description, echeance, statut } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'La description est obligatoire.' });
    }

    const tache = new Tache({
      prospectId: prospectId || undefined,
      commercial,
      description,
      echeance: echeance ? new Date(echeance) : undefined,
      statut: statut || 'A faire',
    });

    const saved = await tache.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/taches', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche.' });
  }
});

app.put('/api/taches/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.echeance) {
      update.echeance = new Date(update.echeance);
    }
    const updated = await Tache.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/taches/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/taches/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Tache.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/taches/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Stock véhicules
app.get('/api/vehicules', authRequired, async (req, res) => {
  const items = await Vehicule.find().sort({ marque: 1, modele: 1 }).lean();
  res.json(items);
});

app.post('/api/vehicules', authRequired, async (req, res) => {
  try {
    const { marque, modele, annee, prix, statut, localisation } = req.body;

    if (!marque || !modele) {
      return res
        .status(400)
        .json({ error: 'Marque et modèle sont obligatoires.' });
    }

    const vehicule = new Vehicule({
      marque,
      modele,
      annee,
      prix,
      statut: statut || 'Disponible',
      localisation,
    });

    const saved = await vehicule.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/vehicules', err);
    res
      .status(500)
      .json({ error: 'Erreur serveur lors de la création du véhicule.' });
  }
});

app.put('/api/vehicules/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const updated = await Vehicule.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Véhicule introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/vehicules/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/vehicules/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicule.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Véhicule introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/vehicules/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Config Relances (cahier des charges - Statut -> Délai, Priorité, Canal)
app.get('/api/config-relances', authRequired, async (req, res) => {
  try {
    let items = await ConfigRelance.find().sort({ statutDossier: 1 }).lean();
    if (items.length === 0) {
      await ConfigRelance.insertMany([
        { statutDossier: 'Nouveau Contact', delaiJours: 1, priorite: 'Haute', canal: 'Appel' },
        { statutDossier: 'En Cours', delaiJours: 3, priorite: 'Moyenne', canal: 'WhatsApp/Email' },
        { statutDossier: 'Documents Manquants', delaiJours: 1, priorite: 'Haute', canal: 'SMS + Appel' },
        { statutDossier: 'Soumis Banque', delaiJours: 5, priorite: 'Basse', canal: 'Email' },
      ]);
      items = await ConfigRelance.find().sort({ statutDossier: 1 }).lean();
    }
    res.json(items);
  } catch (err) {
    console.error('Erreur GET /api/config-relances', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.put('/api/config-relances/:id', authRequired, async (req, res) => {
  try {
    const updated = await ConfigRelance.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Config introuvable.' });
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/config-relances', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Banques partenaires (BGFI, UGB, BICIG, etc.)
app.get('/api/banques', authRequired, async (req, res) => {
  try {
    let items = await Banque.find().sort({ nom: 1 }).lean();
    if (items.length === 0) {
      await Banque.insertMany([
        { nom: 'BGFI', apportMinPourcent: 20, dureeMaxMois: 60, tauxMin: 12, tauxMax: 18 },
        { nom: 'UGB', apportMinPourcent: 25, dureeMaxMois: 48, tauxMin: 14, tauxMax: 20 },
        { nom: 'BICIG', apportMinPourcent: 20, dureeMaxMois: 72, tauxMin: 13, tauxMax: 19 },
        { nom: 'Orabank', apportMinPourcent: 30, dureeMaxMois: 48, tauxMin: 15, tauxMax: 21 },
      ]);
      items = await Banque.find().sort({ nom: 1 }).lean();
    }
    res.json(items);
  } catch (err) {
    console.error('Erreur GET /api/banques', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.post('/api/banques', authRequired, async (req, res) => {
  try {
    const b = new Banque(req.body);
    const saved = await b.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/banques', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.put('/api/banques/:id', authRequired, async (req, res) => {
  try {
    const updated = await Banque.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Banque introuvable.' });
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/banques', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.delete('/api/banques/:id', authRequired, async (req, res) => {
  try {
    const deleted = await Banque.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Banque introuvable.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/banques', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Matching bancaire - banques éligibles pour un prospect
app.get('/api/banques/matching', authRequired, async (req, res) => {
  try {
    const apportPourcent = Number(req.query.apportPourcent) || 20;
    const dureeMois = Number(req.query.dureeMois) || 36;
    const banques = await Banque.find().lean();
    const eligibles = banques.filter(
      (b) =>
        (apportPourcent >= (b.apportMinPourcent || 0)) &&
        (dureeMois <= (b.dureeMaxMois || 999))
    );
    res.json(eligibles);
  } catch (err) {
    console.error('Erreur GET /api/banques/matching', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Dashboard stats (cahier des charges - KPIs)
app.get('/api/dashboard/stats', authRequired, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [nbProspects, pipelineAgg, finalisesAgg, relancesUrgentes, banquesAgg, devisAgg, vehiculesCount] = await Promise.all([
      Prospect.countDocuments(),
      Prospect.aggregate([
        { $match: { statutDossier: 'En Cours' } },
        { $group: { _id: null, total: { $sum: '$budgetClient' } } },
      ]),
      Prospect.countDocuments({ statutDossier: 'Finalisé' }),
      Prospect.countDocuments({
        prochaineRelance: { $gte: today, $lt: tomorrow },
      }),
      Prospect.aggregate([
        { $match: { banqueSoumise: { $exists: true, $ne: '' } } },
        { $group: { _id: '$banqueSoumise', count: { $sum: 1 } } },
      ]),
      Devis.aggregate([{ $group: { _id: null, ca: { $sum: '$montant' } } }]),
      Vehicule.countDocuments(),
    ]);

    const pipelineCommercial = pipelineAgg[0]?.total || 0;
    const totalProspects = nbProspects;
    const tauxTransformation = totalProspects > 0 ? Math.round((finalisesAgg / totalProspects) * 100) : 0;
    const performanceBanques = banquesAgg.reduce((acc, b) => ({ ...acc, [b._id]: b.count }), {});
    const ca = devisAgg[0]?.ca || 0;

    const [disponibles, reserves, vendus] = await Promise.all([
      Vehicule.countDocuments({ statut: 'Disponible' }),
      Vehicule.countDocuments({ statut: 'Réservé' }),
      Vehicule.countDocuments({ statut: 'Vendu' }),
    ]);

    res.json({
      kpi: {
        pipelineCommercial,
        tauxTransformation,
        relancesUrgentes,
        performanceBanques,
        contactsQualifies: nbProspects,
        ca,
      },
      stock: { disponibles, reserves, vendus },
    });
  } catch (err) {
    console.error('Erreur GET /api/dashboard/stats', err);
    res.status(500).json({
      error: 'Erreur serveur lors du chargement des statistiques.',
      details: err.message,
    });
  }
});

// Devis
app.get('/api/devis', authRequired, async (req, res) => {
  const enCours = await Devis.find({ statut: 'En cours' })
    .sort({ createdAt: -1 })
    .lean();
  res.json(enCours);
});

app.get('/api/devis/all', authRequired, async (req, res) => {
  const allDevis = await Devis.find().sort({ createdAt: -1 }).lean();
  res.json(allDevis);
});

app.get('/api/devis/by-prospect/:prospectId', authRequired, async (req, res) => {
  try {
    const devisList = await Devis.find({ prospectId: req.params.prospectId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(devisList);
  } catch (err) {
    console.error('Erreur GET /api/devis/by-prospect:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

const DEVIS_FIELDS = [
  'prospectId', 'numero', 'client', 'vehicule', 'montant', 'statut',
  'clientEntreprise', 'clientResponsable', 'clientTelephone', 'clientEmail',
  'objet', 'premierLoyer', 'mensualiteFixe', 'dureeMois', 'optionAchat',
  'inclus', 'conditions',
  'tvaTaux', 'montantHT', 'tvaMontant', 'montantTTC',
];

app.post('/api/devis', authRequired, async (req, res) => {
  try {
    const body = req.body;
    const numero = body.numero || body.clientEntreprise;
    const client = body.client || body.clientEntreprise;

    if (!numero?.trim() && !client?.trim()) {
      return res
        .status(400)
        .json({ error: 'Numéro de devis ou client/entreprise sont obligatoires.' });
    }

    const data = {};
    for (const k of DEVIS_FIELDS) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    data.statut = data.statut || 'En cours';
    if (data.montant == null && data.premierLoyer != null) data.montant = data.premierLoyer;
    if (data.client == null && data.clientEntreprise) data.client = data.clientEntreprise;
    if (data.vehicule == null && data.objet) data.vehicule = data.objet;

    const devis = new Devis(data);
    const saved = await devis.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/devis', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du devis.' });
  }
});

app.put('/api/devis/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const update = {};
    for (const k of DEVIS_FIELDS) {
      if (body[k] !== undefined) update[k] = body[k];
    }
    if (update.montant == null && update.premierLoyer != null) update.montant = update.premierLoyer;
    if (update.client == null && update.clientEntreprise) update.client = update.clientEntreprise;
    if (update.vehicule == null && update.objet) update.vehicule = update.objet;
    const updated = await Devis.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/devis/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.get('/api/devis/:id/pdf', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const devis = await Devis.findById(id).lean();
    if (!devis) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    const pdfBuffer = await generateDevisPDF(devis);
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      return res.status(500).json({ error: 'Échec de la génération du PDF.' });
    }
    const filename = `DEVIS_CARWAZPLAN_${(devis.numero || id).toString().replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erreur génération PDF devis:', err);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF.',
      detail: err.message,
    });
  }
});

app.delete('/api/devis/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Devis.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/devis/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Factures
app.get('/api/factures', authRequired, async (req, res) => {
  const items = await Facture.find().sort({ dateEmission: -1 }).lean();
  res.json(items);
});

app.post('/api/factures', authRequired, async (req, res) => {
  try {
    const { numero, devisId, client, montant, statut, dateEmission, dateEcheance } = req.body;

    if (!numero || !client) {
      return res.status(400).json({ error: 'Numéro de facture et client sont obligatoires.' });
    }

    const facture = new Facture({
      numero,
      devisId: devisId || undefined,
      client,
      montant,
      statut: statut || 'Émise',
      dateEmission: dateEmission ? new Date(dateEmission) : new Date(),
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
    });

    const saved = await facture.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/factures', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' });
  }
});

app.put('/api/factures/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.dateEmission) {
      update.dateEmission = new Date(update.dateEmission);
    }
    if (update.dateEcheance) {
      update.dateEcheance = new Date(update.dateEcheance);
    }
    const updated = await Facture.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/factures/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/factures/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Facture.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/factures/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Relances Emails
app.get('/api/relances-emails', authRequired, async (req, res) => {
  const items = await RelanceEmail.find().sort({ sequence: 1, nom: 1 }).lean();
  res.json(items);
});

app.post('/api/relances-emails', authRequired, async (req, res) => {
  try {
    const { nom, sujet, corps, sequence } = req.body;

    if (!nom || !sujet) {
      return res.status(400).json({ error: 'Nom et sujet sont obligatoires.' });
    }

    const relance = new RelanceEmail({
      nom,
      sujet,
      corps,
      sequence: sequence || 0,
    });

    const saved = await relance.save();
    res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('Erreur POST /api/relances-emails', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du modèle de relance.' });
  }
});

app.put('/api/relances-emails/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const updated = await RelanceEmail.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Modèle de relance introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/relances-emails/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/relances-emails/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RelanceEmail.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Modèle de relance introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/relances-emails/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// Utilisateurs (pour page Paramètres)
app.get('/api/users', authRequired, async (req, res) => {
  // Seuls les admins peuvent voir tous les utilisateurs
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
  }
  const users = await User.find().select('-passwordHash').sort({ email: 1 }).lean();
  res.json(users);
});

app.put('/api/users/:id', authRequired, async (req, res) => {
  // Seuls les admins peuvent modifier les utilisateurs
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
  }
  try {
    const { id } = req.params;
    const { role } = req.body;
    const update = {};
    if (role === 'admin' || role === 'user') {
      update.role = role;
    }
    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select('-passwordHash').lean();
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/users/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

app.delete('/api/users/:id', authRequired, async (req, res) => {
  // Seuls les admins peuvent supprimer les utilisateurs
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
  }
  try {
    const { id } = req.params;
    // Empêcher la suppression de son propre compte
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    const deleted = await User.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE /api/users/:id', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// 404 pour les routes API inconnues
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route non trouvée' });
  }
  next();
});

// En production : servir le frontend compilé (déploiement sur le réseau)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Démarrage du serveur (écoute sur toutes les interfaces = accessible depuis le réseau)
async function startServer() {
  try {
    await connectDB();
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`Serveur démarré sur http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      if (HOST === '0.0.0.0') {
        console.log('  Accessible depuis le réseau sur http://<IP-DU-SERVEUR>:' + PORT);
      }
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err.message);
    process.exit(1);
  }
}

startServer();

