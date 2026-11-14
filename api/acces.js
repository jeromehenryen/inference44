// Point d'entrée Vercel : /api/acces
module.exports = require('../server/adapter')(require('../server/functions/acces').handler);
