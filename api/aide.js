// Point d'entrée Vercel : /api/aide
module.exports = require('../server/adapter')(require('../server/functions/aide').handler);
