// Suivi centralisé : chaque évènement est un membre d'un ensemble trié Redis (score = horodatage). Aucune réponse d'élève n'est conservée.
// Membre : <horodatage>|<aléa>|<groupe encodé>|<défi>|<question>|<type>|<drapeaux réponse/indices>
const crypto = require('crypto');
const { redis } = require('./store');
const { clean } = require('./http');

async function record(event, e) {
  const g = clean(e.group, 60) || 'inconnu';
  let enc = encodeURIComponent(g);
  if (enc.length > 300) enc = encodeURIComponent(g.slice(0, 25));
  const cid = String(e.cid || '').replace(/[^\w-]/g, '').slice(0, 40);
  const q = Math.max(0, Math.min(99, parseInt(e.q, 10) || 0));
  const type = ['check', 'hint', 'done'].includes(e.type) ? e.type : 'check';
  const flags = (e.ok ? '1' : '0') + (e.a ? '1' : '0') + (e.c ? '1' : '0');
  const ts = Date.now();
  await redis().zadd('ev', { score: ts, member: [ts, crypto.randomBytes(3).toString('hex'), enc, cid, q, type, flags].join('|') });
}
function parseKey(key) {
  const p = String(key).split('|');
  if (p.length !== 7) return null;
  const ts = Number(p[0]);
  if (!ts) return null;
  let group; try { group = decodeURIComponent(p[2]); } catch (e) { group = p[2]; }
  return { ts, group, cid: p[3], q: Number(p[4]) || 0, type: p[5], ok: p[6][0] === '1', a: p[6][1] === '1', c: p[6][2] === '1' };
}
async function listEvents(event) {
  const members = await redis().zrange('ev', 0, -1);
  return members.map(parseKey).filter(Boolean).sort((a, b) => a.ts - b.ts).slice(-20000);
}
async function clearEvents(event) {
  const n = await redis().zcard('ev');
  await redis().del('ev');
  return n;
}
const purgeOld = (event, days) => redis().zremrangebyscore('ev', 0, Date.now() - days * 864e5);
module.exports = { record, listEvents, clearEvents, purgeOld };
