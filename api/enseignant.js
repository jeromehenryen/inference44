// Point d'entrée Vercel : /api/enseignant
module.exports = require('../server/adapter')(require('../server/functions/enseignant').handler);
