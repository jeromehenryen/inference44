// Page de diagnostic : ouvrir  /api/sante  (ajouter ?albert=1 pour tester aussi la clé et le modèle Albert).
// Ne révèle aucun secret : seulement si les variables existent, si le stockage répond et si le modèle est disponible.
const { reply, preflight, safe } = require('./lib/http');
const API_URL = process.env.ALBERT_API_URL || 'https://albert.api.etalab.gouv.fr/v1/chat/completions';
const MODEL = process.env.ALBERT_MODEL || 'albert-large';

exports.handler = safe(async (event) => {
  const p = preflight(event); if (p) return p;
  const steps = [], add = (name, ok, detail) => steps.push({ name, ok, detail: detail || '' });
  add('Version de Node', true, process.version);
  add('Variable ALBERT_API_KEY', !!process.env.ALBERT_API_KEY, process.env.ALBERT_API_KEY ? 'définie' : 'ABSENTE : à créer dans Vercel (Settings → Environment Variables) puis redéployer');
  add('Variable ADMIN_PASSWORD', !!process.env.ADMIN_PASSWORD, process.env.ADMIN_PASSWORD ? 'définie' : 'ABSENTE : à créer dans Vercel (Settings → Environment Variables) puis redéployer');
  add('Modèle Albert configuré', true, process.env.ALBERT_MODEL ? MODEL : MODEL + ' (valeur par défaut : variable ALBERT_MODEL non définie)');

  let dataOk = false;
  try { require('./lib/data'); require('./lib/limits'); require('./lib/track'); require('./lib/judge'); require('./lib/groups'); dataOk = true; add('Chargement des modules serveur', true); }
  catch (e) { add('Chargement des modules serveur', false, String(e.message).slice(0, 200)); }

  add('Base Redis connectée (KV_REST_API_URL, KV_REST_API_TOKEN)', !!((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)), (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) ? 'variables présentes' : 'ABSENTES : Storage → Upstash for Redis → connecter au projet, puis redéployer');
  try {
    const { redis } = require('./lib/store'), r = redis(), t0 = Date.now(), v = String(t0);
    await r.set('sante-test', v, { ex: 30 });
    const back = String(await r.get('sante-test')); await r.del('sante-test');
    add('Stockage Redis (écriture, lecture)', back === v, back === v ? (Date.now() - t0) + ' ms' : 'la valeur relue est différente');
  } catch (e) { add('Stockage Redis (écriture, lecture)', false, String(e.message).slice(0, 200)); }

  if (dataOk) {
    try {
      const { getChallenges, getCodes, getTeachers } = require('./lib/data');
      const [c, k, t] = await Promise.all([getChallenges(event), getCodes(event), getTeachers(event)]);
      const withCode = c.filter(x => k[x.id] && k[x.id].access).length;
      add('Défis, codes, enseignants', true, c.length + ' défis, ' + withCode + ' avec code d’accès, ' + t.length + ' enseignant(s)');
    } catch (e) { add('Défis, codes, enseignants', false, String(e.message).slice(0, 200)); }
  }

  if ((event.queryStringParameters || {}).albert && process.env.ALBERT_API_KEY) {
    try {
      const r = await fetch(API_URL.replace(/\/chat\/completions\/?$/, '/models'), { headers: { Authorization: 'Bearer ' + process.env.ALBERT_API_KEY } });
      if (!r.ok) add('Clé Albert', false, 'HTTP ' + r.status + (r.status === 401 || r.status === 403 ? ' : clé refusée' : ''));
      else {
        const data = await r.json(), list = (data.data || []), gen = list.filter(m => !m.type || m.type === 'text-generation').map(m => m.id);
        add('Clé Albert', true, 'acceptée');
        add('Modèle « ' + MODEL + ' » disponible', gen.includes(MODEL), gen.includes(MODEL) ? 'oui' : 'NON. Modèles de génération de texte disponibles : ' + gen.join(', ') + ' (à mettre dans ALBERT_MODEL)');
      }
    } catch (e) { add('Clé Albert', false, 'Albert injoignable : ' + String(e.message).slice(0, 150)); }
  } else if ((event.queryStringParameters || {}).albert) add('Test Albert', false, 'impossible sans ALBERT_API_KEY');

  const ok = steps.every(s => s.ok);
  const accept = String((event.headers || {}).accept || '');
  if (accept.includes('text/html') && !(event.queryStringParameters || {}).json) {
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diagnostic</title><body style="font-family:system-ui;max-width:760px;margin:30px auto;padding:0 16px"><h1>Diagnostic – Mission Inférences</h1><p><strong>' + (ok ? '✅ Tout est en ordre.' : '❌ Un point est à corriger.') + '</strong></p><ul style="line-height:1.7">' + steps.map(s => '<li>' + (s.ok ? '✅' : '❌') + ' <strong>' + esc(s.name) + '</strong>' + (s.detail ? ' : ' + esc(s.detail) : '') + '</li>').join('') + '</ul><p><a href="?albert=1">Tester aussi la clé et le modèle Albert</a></p></body>' };
  }
  return reply(ok ? 200 : 500, { ok, steps });
});
