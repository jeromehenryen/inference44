// Adaptateur : transforme une requête Vercel (Node) en « évènement » simple et renvoie la réponse produite par la fonction.
module.exports = (handler) => async (req, res) => {
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  else if (body && typeof body === 'object') body = JSON.stringify(body);
  const event = { httpMethod: req.method, headers: req.headers || {}, body: body || '', queryStringParameters: req.query || {} };
  let out;
  try { out = await handler(event); }
  catch (e) {
    console.error('Erreur fonction', e);
    out = { statusCode: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ error: 'Erreur serveur', detail: String((e && e.message) || e).slice(0, 200) }) };
  }
  res.statusCode = out.statusCode || 200;
  Object.entries(out.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(out.body || '');
};
