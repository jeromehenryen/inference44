// Stockage : Upstash Redis, connecté au projet Vercel (variables KV_REST_API_URL et KV_REST_API_TOKEN).
let client = null;
exports.redis = () => {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Base Redis non connectée (variables KV_REST_API_URL et KV_REST_API_TOKEN absentes)');
  const { Redis } = require('@upstash/redis');
  client = new Redis({ url, token });
  return client;
};
