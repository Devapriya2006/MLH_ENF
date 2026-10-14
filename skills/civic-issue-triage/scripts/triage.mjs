#!/usr/bin/env node
// Civic issue triage using a local open-weight vision model served by Ollama.
// Usage: node triage.mjs <image> [--lang en|bn|hi] [--model name] [--url http://127.0.0.1:11434]
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, d) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : d; };
const file = args.find(a => !a.startsWith('--') && fs.existsSync(a));
const URL_ = (opt('url', process.env.OLLAMA_URL || 'http://127.0.0.1:11434')).replace(/\/$/, '');
const MODEL = opt('model', process.env.VISION_MODEL || 'qwen3-vl:4b-instruct');
const LANG = { en: 'English', bn: 'Bengali', hi: 'Hindi' }[opt('lang', 'en')] || 'English';
const fail = (m) => { console.error(`Error: ${m}`); process.exit(1); };
if (!file) fail('Usage: node triage.mjs <image-path> [--lang en|bn|hi] [--model name] [--url url]');

const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water_leakage', 'road_damage', 'waterlogging', 'fallen_tree', 'traffic_sign', 'other'];
const DEPARTMENTS = {
  pothole: 'Road & Transport', road_damage: 'Road & Transport', traffic_sign: 'Traffic Police / Road & Transport',
  streetlight: 'Electrical Department', garbage: 'Solid Waste Management', water_leakage: 'Water Supply Department',
  waterlogging: 'Drainage & Sewerage', fallen_tree: 'Parks & Horticulture', other: 'General Administration',
};
const schema = {
  type: 'object',
  properties: {
    is_civic_issue: { type: 'boolean' }, category: { type: 'string', enum: CATEGORIES },
    confidence: { type: 'integer' }, severity: { type: 'integer' }, risk: { type: 'string' },
    title: { type: 'string' }, description: { type: 'string' },
  },
  required: ['is_civic_issue', 'category', 'confidence', 'severity', 'risk', 'title', 'description'],
};
const system = `You triage photos of civic problems for a municipal reporting platform. Fill the JSON fields.
- If the photo shows no civic infrastructure or sanitation problem: is_civic_issue=false, category="other".
- category is one of: ${CATEGORIES.join(', ')}.
- confidence and severity are integers 0-100. Severity: 0-33 minor, 34-66 needs attention soon, 67-100 urgent hazard.
- risk: one short phrase. title: max 10 words.
- description: 2-3 formal, factual sentences as a complaint to the municipal authority. Only describe what is visible.
- Write title, risk and description in ${LANG}. Keep keys and category values in English.`;

let res;
try {
  res = await fetch(`${URL_}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(180_000),
    body: JSON.stringify({
      model: MODEL, stream: false, format: schema, options: { temperature: 0, num_predict: 700 },
      messages: [{ role: 'system', content: system }, { role: 'user', content: 'Analyze this photo.', images: [fs.readFileSync(file).toString('base64')] }],
    }),
  });
} catch { fail(`Cannot reach Ollama at ${URL_}. Install it from ollama.com and start it ("ollama serve").`); }
if (res.status === 404) fail(`Model "${MODEL}" is not installed. Run: ollama pull ${MODEL}`);
if (!res.ok) fail(`Ollama returned HTTP ${res.status}`);

let out;
try { out = JSON.parse((await res.json()).message.content); } catch { fail('The model returned an unreadable answer. Try again.'); }
const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n)))) || 0;
const category = CATEGORIES.includes(out.category) ? out.category : 'other';
console.log(JSON.stringify({
  is_civic_issue: !!out.is_civic_issue, category, confidence: clamp(out.confidence), severity: clamp(out.severity),
  risk: out.risk || '', title: out.title || '', description: out.description || '',
  department: DEPARTMENTS[category], model: MODEL,
}, null, 2));
