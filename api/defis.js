// Point d'entrée Vercel : /api/defis
module.exports = require('../server/adapter')(require('../server/functions/defis').handler);
