/**
 * Générateur de PDF pour devis CARWAZPLAN LE BON WAZ
 * Modèle adapté de DEVIS_CARWAZPLAN_LEBONWAZ.pdf
 */
const PDFDocument = require('pdfkit');

const ENTREPRISE = {
  nom: 'LE BON WAZ – Centrale d\'approvisionnement & Logistique',
  forme: 'SARLU',
  capital: '3 000 000 FCFA',
  rccm: 'GA-LBV-01-2021-B13-00207',
  nif: '202101005355 V',
  adresse: 'Rond-Point Okala, Libreville – Gabon',
  telephone: '(+241) 65 73 71 22',
  email: 'jecontacte@lebonwaz.com',
};

const PLACEHOLDER = '....................................................';

function formatFCFA(n) {
  if (n == null || isNaN(n)) return '-';
  return Number(n).toLocaleString('fr-FR');
}

function buildDevisPDF(doc, devis) {
  const clientEnt = devis.clientEntreprise || devis.client || PLACEHOLDER;
  const clientResp = devis.clientResponsable || PLACEHOLDER;
  const clientTel = devis.clientTelephone || PLACEHOLDER;
  const clientMail = devis.clientEmail || PLACEHOLDER;
  const objet = devis.objet || (devis.vehicule ? `Leasing intégral ALL-INCLUSIVE – ${devis.vehicule}` : PLACEHOLDER);
  const premierLoyer = devis.premierLoyer ?? devis.montant ?? 0;
  const mensualite = devis.mensualiteFixe ?? 0;
  const duree = devis.dureeMois ?? 48;
  const optionAchat = devis.optionAchat ?? 0;
  const tvaTaux = devis.tvaTaux ?? 0;
  const montantHT = devis.montantHT ?? (premierLoyer + mensualite * duree + optionAchat);
  const tvaMontant = devis.tvaMontant ?? (tvaTaux ? (montantHT * tvaTaux / 100) : 0);
  const montantTTC = devis.montantTTC ?? (montantHT + tvaMontant);

  let inclus = Array.isArray(devis.inclus) && devis.inclus.length
    ? devis.inclus
    : (typeof devis.inclus === 'string' ? devis.inclus.split('\n').map(s => s.trim()).filter(Boolean) : []);
  let conditions = Array.isArray(devis.conditions) && devis.conditions.length
    ? devis.conditions
    : (typeof devis.conditions === 'string' ? devis.conditions.split('\n').map(s => s.trim()).filter(Boolean) : []);

  const vehiculeDesignation = devis.objet || devis.vehicule || 'selon désignation';
  if (!inclus.length) {
    inclus = [
      `- Véhicule neuf ${vehiculeDesignation}${vehiculeDesignation !== 'selon désignation' ? ' (SUV)' : ''}`,
      '- Assurance TOUS RISQUES 4 ans (Partenaire AXA/SANLAM)',
      '- Tracker GPS avec coupe-circuit 24h/24',
      '- Gestion administrative complète (Carte grise, plaques, mise à la route)',
      '- Optimisation fiscale : loyers déductibles (selon CGI Gabon)',
    ];
  }
  if (!conditions.length) {
    conditions = [
      `- Durée : ${duree} mois`,
      '- OVPI obligatoire à la signature',
      '- Réserve de propriété jusqu\'à levée d\'option',
      '- Conformité OHADA & CIMA',
    ];
  }

  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // ========== EN-TÊTE ==========
  doc.fontSize(18).font('Helvetica-Bold').text('DEVIS – CARWAZPLAN LE BON WAZ', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text(ENTREPRISE.nom, { align: 'center' });
  doc.text(`${ENTREPRISE.forme} – Capital : ${ENTREPRISE.capital}`, { align: 'center' });
  doc.text(`RCCM : ${ENTREPRISE.rccm}`, { align: 'center' });
  doc.text(`NIF : ${ENTREPRISE.nif}`, { align: 'center' });
  doc.text(`Adresse : ${ENTREPRISE.adresse}`, { align: 'center' });
  doc.text(`Téléphone : ${ENTREPRISE.telephone}`, { align: 'center' });
  doc.text(`Email : ${ENTREPRISE.email}`, { align: 'center' });
  doc.moveDown(1);

  // ========== INFORMATIONS CLIENT ==========
  doc.font('Helvetica-Bold').text('INFORMATIONS CLIENT');
  doc.font('Helvetica');
  doc.text(`Entreprise : ${clientEnt}`);
  doc.text(`Responsable : ${clientResp}`);
  doc.text(`Téléphone : ${clientTel}`);
  doc.text(`Email : ${clientMail}`);
  doc.moveDown(1);

  // ========== OBJET ==========
  doc.font('Helvetica-Bold').text(`OBJET : ${objet}`);
  doc.moveDown(0.5);

  // ========== TABLEAU DES MONTANTS ==========
  const col1 = margin;
  const col2 = 380;
  const lh = 16;
  let y = doc.y;

  doc.font('Helvetica-Bold');
  doc.text('Désignation', col1, y);
  doc.text('Montant (FCFA)', col2, y);
  y += lh;
  doc.moveTo(col1, y).lineTo(pageWidth - margin, y).stroke();
  y += 8;
  doc.font('Helvetica');

  doc.text('1er loyer majoré (Apport)', col1, y);
  doc.text(formatFCFA(premierLoyer), col2, y);
  y += lh;

  doc.text(`Mensualité fixe (${duree} mois)`, col1, y);
  doc.text(`${formatFCFA(mensualite)} / mois`, col2, y);
  y += lh;

  doc.text(`Option d'achat (${duree}ème mois)`, col1, y);
  doc.text(formatFCFA(optionAchat), col2, y);
  y += lh;

  if (tvaTaux > 0) {
    doc.text('Montant HT', col1, y);
    doc.text(formatFCFA(montantHT), col2, y);
    y += lh;
    doc.text(`TVA (${tvaTaux}%)`, col1, y);
    doc.text(formatFCFA(tvaMontant), col2, y);
    y += lh;
    doc.font('Helvetica-Bold');
    doc.text('Montant TTC', col1, y);
    doc.text(formatFCFA(montantTTC), col2, y);
    doc.font('Helvetica');
    y += lh;
  }
  doc.y = y + 12;

  // ========== INCLUS DANS LE CONTRAT ==========
  doc.font('Helvetica-Bold').text('INCLUS DANS LE CONTRAT :');
  doc.font('Helvetica');
  inclus.forEach((l) => doc.text(l));
  doc.moveDown(1);

  // ========== CONDITIONS CONTRACTUELLES ==========
  doc.font('Helvetica-Bold').text('CONDITIONS CONTRACTUELLES :');
  doc.font('Helvetica');
  conditions.forEach((l) => doc.text(l));
  doc.moveDown(1.5);

  // ========== SIGNATURES ==========
  doc.text('Arrêté le présent devis pour étude et validation client.');
  doc.moveDown(1);
  doc.text('Signature Client : _______________________');
  doc.text('Signature LE BON WAZ : _______________________');

  // Pied de page
  doc.fontSize(9).font('Helvetica').fillColor('#666666');
  doc.text('-- 1 --', margin, pageHeight - 30, { align: 'center', width: pageWidth - 2 * margin });
  doc.fillColor('#000000');
}

/**
 * Génère un PDF de devis et le retourne en buffer
 * @param {Object} devis - Objet devis (MongoDB)
 * @returns {Promise<Buffer>}
 */
async function generateDevisPDF(devis) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      buildDevisPDF(doc, devis);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateDevisPDF, buildDevisPDF };
