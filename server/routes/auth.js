import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const publicUser = u => ({
  id: u._id, name: u.name, email: u.email, role: u.role, department: u.department, points: u.points,
  phone: u.phone, location: u.location, fullAddress: u.fullAddress,
});
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ error: 'Enter a valid email address' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered' });
  const user = await User.create({
    name: String(name).trim(), email: String(email).trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 10), role: 'citizen',
    phone: req.body.phone, location: req.body.location, fullAddress: req.body.fullAddress,
    idProofType: req.body.idProofType, idProofNumber: req.body.idProofNumber, gender: req.body.gender,
    dob: req.body.dob ? new Date(req.body.dob) : undefined,
  });
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)))
    return res.status(400).json({ error: 'Invalid email or password' });
  const requestedRole = req.body.role === 'admin' ? 'admin' : 'citizen';
  if (user.role !== requestedRole) return res.status(403).json({ error: requestedRole === 'admin' ? 'This account does not have administrator access' : 'Use the administrator login for this account' });
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.patch('/profile', auth, wrap(async (req, res) => {
  const fields = ['name', 'phone', 'location', 'fullAddress'];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== 'string' || req.body[field].trim().length > (field === 'fullAddress' ? 300 : 120))
        return res.status(400).json({ error: `Invalid ${field}` });
      if (field === 'name' && !req.body[field].trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      req.user[field] = req.body[field].trim();
    }
  }
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));
export default router;
