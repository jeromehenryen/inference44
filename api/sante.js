// Point d'entrée Vercel : /api/sante
module.exports = require('../server/adapter')(require('../server/functions/sante').handler);
