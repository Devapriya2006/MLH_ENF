import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const extension = mime => ({ 'image/png': '.png', 'image/webp': '.webp' })[mime] || '.jpg';

export async function saveImage(file) {
  fs.mkdirSync(dir, { recursive: true });
  const ext = extension(file.mimetype);
  const fileName = `${crypto.randomUUID()}${ext}`;
  await fsp.writeFile(path.join(dir, fileName), file.buffer, { flag: 'wx' });

  // Relative paths keep images on the same origin, including through the Vite tunnel proxy.
  const url = `/uploads/${fileName}`;

  return { url, key: fileName, storage: 'local', mime: file.mimetype, size: file.size || file.buffer.length };
}

export async function deleteImage(image) {
  if (!image?.key || path.basename(image.key) !== image.key) return;
  await fsp.unlink(path.join(dir, image.key)).catch(() => {});
}

export async function fetchImage(url) {
  const key = String(url || '').split('/').pop();
  if (!key || path.basename(key) !== key) throw new Error('Invalid image key');
  const buffer = await fsp.readFile(path.join(dir, key));
  return { buffer, mime: ({ '.png': 'image/png', '.webp': 'image/webp' })[path.extname(key)] || 'image/jpeg' };
}
