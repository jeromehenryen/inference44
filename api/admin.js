// Point d'entrée Vercel : /api/admin
module.exports = require('../server/adapter')(require('../server/functions/admin').handler);
