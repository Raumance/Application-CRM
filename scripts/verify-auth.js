/**
 * Script de vérification de l'authentification
 * Teste les endpoints auth : login (email) et config Google
 *
 * Usage : node scripts/verify-auth.js [BASE_URL]
 * Exemple : node scripts/verify-auth.js http://localhost:4000
 */

const BASE = process.argv[2] || 'http://localhost:4000';

async function test(name, fn) {
  try {
    await fn();
    console.log('  ✅', name);
  } catch (err) {
    console.log('  ❌', name, '-', err.message);
  }
}

async function run() {
  console.log('\n=== Vérification authentification CRM ===\n');
  console.log('URL backend:', BASE);

  await test('GET /api/health', async () => {
    const r = await fetch(`${BASE}/api/health`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (d.status !== 'ok') throw new Error('Réponse inattendue');
  });

  await test('POST /api/auth/login (format invalide)', async () => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (r.status !== 400) throw new Error(`Attendu 400, reçu ${r.status}`);
  });

  await test('POST /api/auth/login (identifiants invalides)', async () => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });
    if (r.status !== 401 && r.status !== 400) throw new Error(`Attendu 401/400, reçu ${r.status}`);
  });

  await test('POST /api/auth/login (réponse structurée)', async () => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inexistant@test.com', password: 'xxx' }),
    });
    const text = await r.text();
    if (text.startsWith('<') || text.startsWith('<!')) throw new Error('Réponse HTML au lieu de JSON - backend inaccessible?');
    const d = text ? JSON.parse(text) : {};
    if (r.status === 401 && d.error) {
      console.log('    Auth endpoint OK (401 = identifiants invalides, attendu)');
      return;
    }
    if (r.ok && d.token) {
      console.log('    Connexion réussie - token reçu');
      return;
    }
    throw new Error(`Réponse inattendue: ${r.status}`);
  });

  console.log('\n--- Configuration Google ---');
  await test('GET /api/auth/google (redirection)', async () => {
    const r = await fetch(`${BASE}/api/auth/google`, { redirect: 'manual' });
    if (r.status === 302) {
      const loc = r.headers.get('location') || '';
      if (loc.includes('accounts.google.com')) console.log('    Redirection Google OK');
      else if (loc.includes('error=google_config')) console.log('    ⚠️  GOOGLE_CLIENT_ID/SECRET non configurés dans .env');
      else throw new Error('URL redirection inattendue');
    } else throw new Error(`Attendu 302, reçu ${r.status}`);
  });

  console.log('\n=== Fin de la vérification ===\n');
}

run().catch((e) => {
  console.error('Erreur:', e.message);
  process.exit(1);
});
