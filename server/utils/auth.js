const fs = require('fs');
const path = require('path');

const KEYS_PATH = path.join(__dirname, '..', 'data', 'apiKeys.json');

let keys = [];
try {
  keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
} catch {
  keys = [];
}

const rateBuckets = new Map();

function findKey(raw) {
  if (!raw) return null;
  return keys.find((k) => k.key === raw && k.active) || null;
}

function rateLimit(key) {
  if (!key.rateLimitPerMinute) return { ok: true };
  const now = Date.now();
  const bucket = rateBuckets.get(key.key) || { count: 0, resetAt: now + 60_000 };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  bucket.count++;
  rateBuckets.set(key.key, bucket);
  if (bucket.count > key.rateLimitPerMinute) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

function apiKeyAuth({ required = false } = {}) {
  return (req, res, next) => {
    const raw = req.header('x-api-key') || req.query.apiKey;
    const key = findKey(raw);
    if (!key) {
      if (required) {
        return res.status(401).json({ error: 'invalid or missing API key' });
      }
      return next();
    }
    const limit = rateLimit(key);
    if (!limit.ok) {
      return res.status(429).json({ error: 'rate limit exceeded', retryAfter: limit.retryAfter });
    }
    req.apiKey = key;
    next();
  };
}

module.exports = { apiKeyAuth };
