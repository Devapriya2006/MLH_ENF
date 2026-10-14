// Tiny in-memory limiter (per user). Protects the paid AI endpoint.
const hits = new Map();
export function rateLimit({ max = 30, windowMs = 10 * 60 * 1000 } = {}) {
  return (req, res, next) => {
    const key = String(req.user?._id || req.ip);
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many analysis requests. Try again shortly.' });
    arr.push(now); hits.set(key, arr); next();
  };
}
