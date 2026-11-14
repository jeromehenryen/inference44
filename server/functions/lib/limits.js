// Limites d'usage : compteurs Redis (INCR + expiration automatique). En cas de panne du stockage, on ne bloque personne.
const crypto = require('crypto');
const { redis } = require('./store');
const keyOf = (name, key, windowMs) => `lim|${name}|${crypto.createHash('sha1').update(String(key)).digest('hex').slice(0, 16)}|${Math.floor(Date.now() / windowMs)}`;
async function peek(event, name, key, windowMs) {
  try { return parseInt(await redis().get(keyOf(name, key, windowMs)), 10) || 0; } catch (e) { return 0; }
}
async function bump(event, name, key, windowMs) {
  try {
    const k = keyOf(name, key, windowMs), n = await redis().incr(k);
    if (n === 1) await redis().expire(k, Math.ceil(windowMs / 1000) * 2);
    return n;
  } catch (e) { return 0; }
}
const cleanup = async () => {}; // les compteurs expirent seuls
module.exports = { peek, bump, cleanup };
