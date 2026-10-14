import multer from 'multer';
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Only JPEG, PNG, and WebP images are allowed'), { status: 400 })),
});

export async function validateUploadedImage(file) {
  if (!file) throw Object.assign(new Error('An image is required'), { status: 400 });
  const b = file.buffer;
  const mime = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'image/jpeg'
    : b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png'
    : b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null;
  if (!mime || mime !== file.mimetype) {
    throw Object.assign(new Error('Image contents do not match a supported image type'), { status: 400 });
  }
  return { mime };
}
