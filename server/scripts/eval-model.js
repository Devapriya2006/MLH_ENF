// Benchmark a vision model on your own labelled photos.
//   npm run eval -- ./samples        (files named like  pothole_01.jpg, garbage-3.png ...)
// The text before the first "_" or "-" in the filename is the expected category.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { analyzeImage, MODEL } from '../services/vision.js';
import { CATEGORIES } from '../utils/constants.js';

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error('Usage: npm run eval -- <folder-with-labelled-images>'); process.exit(1); }
const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
console.log(`Model: ${MODEL()}  |  ${files.length} images\n`);

let ok = 0, ms = 0;
for (const f of files) {
  const expected = f.split(/[_-]/)[0].toLowerCase();
  if (!CATEGORIES.includes(expected)) { console.log(`skip ${f} (unknown label "${expected}")`); continue; }
  const t = Date.now();
  try {
    const r = await analyzeImage(fs.readFileSync(path.join(dir, f)), '', 'en');
    const dt = Date.now() - t; ms += dt;
    const hit = r.category === expected; if (hit) ok++;
    console.log(`${hit ? 'PASS' : 'FAIL'}  ${f.padEnd(28)} -> ${r.category.padEnd(14)} conf ${String(r.confidence).padStart(3)}  sev ${String(r.severity).padStart(3)}  ${(dt / 1000).toFixed(1)}s`);
  } catch (e) { console.log(`ERR   ${f}: ${e.message}`); process.exit(1); }
}
console.log(`\nAccuracy: ${ok}/${files.length}  |  avg latency ${(ms / Math.max(files.length, 1) / 1000).toFixed(1)}s`);
