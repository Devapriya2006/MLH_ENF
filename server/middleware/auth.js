import jwt from 'jsonwebtoken';
import User from '../models/User.js';

async function load(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(id).select('-passwordHash');
}
export async function auth(req, res, next) {
  try {
    const u = await load(req);
    if (!u) return res.status(401).json({ error: 'Please log in' });
    req.user = u; next();
  } catch { res.status(401).json({ error: 'Invalid or expired session' }); }
}
export async function optionalAuth(req, _res, next) {
  try { req.user = await load(req); } catch { req.user = null; }
  next();
}
export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access only' });
