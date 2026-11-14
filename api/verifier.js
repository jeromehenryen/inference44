// Point d'entrée Vercel : /api/verifier
module.exports = require('../server/adapter')(require('../server/functions/verifier').handler);
