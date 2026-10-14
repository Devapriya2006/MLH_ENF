import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import Complaint from './models/Complaint.js';
import { computePriority } from './utils/priority.js';
import { CLOSED } from './utils/constants.js';
import { aiHealth } from './services/vision.js';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
process.env.JWT_SECRET ||= 'development-only-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : true }));
app.use(express.json({ limit: '1mb' }));
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
app.get('/api/health', async (_req, res) => res.json({ ok: true, ai: await aiHealth() }));
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
// Serve the built React app in production
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err.message);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || (err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message || 'Request failed' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  await Complaint.updateMany(
    { analysisStatus: { $in: ['pending', 'processing'] } },
    { $set: { analysisStatus: 'failed', humanReview: true, analysisError: 'Analysis was interrupted. An administrator can retry it.' } },
  );
  app.listen(PORT, async () => {
    console.log(`CivicLens API on :${PORT}`);
    const ai = await aiHealth();
    if (ai.engine === 'cloudflare' && ai.reachable) {
      console.log(`AI: ready (${ai.model}, Cloudflare Workers AI)`);
    } else if (ai.engine === 'ollama' && ai.reachable) {
      console.log(`AI: ready (${ai.model}, local Ollama)`);
    } else {
      console.log(`AI: active (${ai.model})`);
    }
  });
  // Hourly priority refresh so older unresolved issues rise (aging factor)
  setInterval(async () => {
    const open = await Complaint.find({ status: { $nin: CLOSED } });
    for (const c of open) { c.priority = computePriority(c); await c.save(); }
  }, 60 * 60 * 1000);
}).catch(e => { console.error('DB connection failed:', e.message); process.exit(1); });
