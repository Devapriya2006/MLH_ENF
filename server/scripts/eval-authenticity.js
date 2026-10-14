// Evaluate labeled camera captures with the configured real vision provider.
// Fixture layout: <root>/<real|printed|phone-screen|computer-screen|unrelated|unclear>/*.{jpg,png,webp}
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { analyzeImage, MODEL, isMockMode } from '../services/vision.js';

const root = path.resolve(process.argv[2] || 'test-data/authenticity');
const labels = {
  real: { expected: 'LIKELY_REAL_SCENE', category: 'pothole', description: 'A pothole is visible in the road.' },
  printed: { expected: 'POSSIBLE_PRINTED_PHOTO', category: 'pothole', description: 'A pothole is visible in the road.' },
  'phone-screen': { expected: 'POSSIBLE_SCREEN_PHOTO', category: 'pothole', description: 'A pothole is visible in the road.' },
  'computer-screen': { expected: 'POSSIBLE_SCREEN_PHOTO', category: 'pothole', description: 'A pothole is visible in the road.' },
  unrelated: { expected: 'UNRELATED', category: 'pothole', description: 'A pothole is visible in the road.' },
  unclear: { expected: 'INCONCLUSIVE', category: 'pothole', description: 'A pothole may be present but is unclear.' },
};
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const mimeFor = file => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(file).toLowerCase()]);
const files = [];
for (const [folder, label] of Object.entries(labels)) {
  const dir = path.join(root, folder);
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { continue; }
  for (const entry of entries) if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push({ file: path.join(dir, entry.name), folder, ...label });
}

console.log(JSON.stringify({ model: MODEL(), provider: process.env.AI_PROVIDER || 'ollama (default)', mockMode: isMockMode(), fixtureRoot: root, casesFound: files.length }, null, 2));
if (isMockMode()) {
  console.error('Refusing to evaluate AI_MODE=mock: mock outputs are not model evidence.');
  process.exit(2);
}
if (!files.length) {
  console.error('No labeled images found. Add real live-camera examples to the six labeled subfolders; see test-data/authenticity/README.md.');
  process.exit(2);
}

const rows = [];
for (const item of files) {
  const started = performance.now();
  try {
    const result = await analyzeImage(await fs.readFile(item.file), mimeFor(item.file), 'en', { category: item.category, description: item.description });
    const elapsedMs = Math.round(performance.now() - started);
    const actual = result.authenticityStatus || 'INCONCLUSIVE';
    const correct = item.expected === actual || (item.expected === 'UNRELATED' && result.issueDetected === false);
    rows.push({
      file: path.relative(root, item.file), expected: item.expected, actual,
      reason: result.authenticityReason, issueDetected: result.issueDetected,
      confidence: result.authenticityConfidence, needsHumanReview: result.needsHumanReview,
      correct, elapsedMs,
      falseRejection: item.folder === 'real' && actual !== 'LIKELY_REAL_SCENE',
      falseAcceptance: ['printed', 'phone-screen', 'computer-screen'].includes(item.folder) && actual === 'LIKELY_REAL_SCENE',
    });
  } catch (error) {
    rows.push({ file: path.relative(root, item.file), expected: item.expected, actual: 'MODEL_ERROR', reason: error.message, correct: false, elapsedMs: Math.round(performance.now() - started), falseRejection: item.folder === 'real', falseAcceptance: false });
  }
}
const report = {
  model: MODEL(), provider: process.env.AI_PROVIDER || 'ollama (default)', generatedAt: new Date().toISOString(),
  results: rows,
  summary: {
    cases: rows.length, correct: rows.filter(row => row.correct).length,
    falseRejectionsOfReal: rows.filter(row => row.falseRejection).length,
    falseAcceptancesOfScreenOrPrint: rows.filter(row => row.falseAcceptance).length,
    averageAnalysisMs: Math.round(rows.reduce((sum, row) => sum + row.elapsedMs, 0) / rows.length),
  },
};
console.log(JSON.stringify(report, null, 2));
const output = path.resolve(process.argv[3] || 'test-data/authenticity/results.json');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2));
console.log('Saved evaluation to ' + output);
