import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

await connectDB();
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) {
  throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an administrator. No demo users or complaints are generated.');
}
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) throw new Error(`An account already exists for ${email}; refusing to overwrite existing data.`);
await User.create({
  name: process.env.SEED_ADMIN_NAME || 'Administrator',
  email: email.toLowerCase(),
  passwordHash: await bcrypt.hash(password, 12),
  role: 'admin',
  department: process.env.SEED_ADMIN_DEPARTMENT || 'All Departments',
});
console.log(`Created administrator account for ${email}. Existing accounts and reports were left untouched.`);
await mongoose.disconnect();
