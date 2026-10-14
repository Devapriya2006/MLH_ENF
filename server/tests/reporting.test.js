import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { deleteImage, fetchImage, saveImage } from '../services/storage.js';
import { classifyAnalysis, toServerCategory, validateReportInput } from '../utils/reporting.js';
import { validateUploadedImage } from '../middleware/upload.js';

const validInput = overrides => ({
  category: 'pothole',
  description: 'A deep pothole is blocking the left lane.',
  lat: '22.5726',
  lng: '88.3639',
  locationAccuracy: '12',
  capturedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  submissionId: randomUUID(),
  ...overrides,
});

test('valid report input requires supported category, description, fresh capture and accurate device coordinates', () => {
  assert.equal(validateReportInput(validInput()).error, undefined);
});

test('report validation rejects missing coordinates, poor accuracy, invalid categories and short descriptions', () => {
  assert.match(validateReportInput(validInput({ lat: '' })).error, /location/i);
  assert.match(validateReportInput(validInput({ locationAccuracy: '35' })).error, /accuracy/i);
  assert.match(validateReportInput(validInput({ category: 'fake-category' })).error, /category/i);
  assert.match(validateReportInput(validInput({ description: 'short' })).error, /10 to 1000/i);
});

test('report validation rejects stale evidence', () => {
  assert.match(validateReportInput(validInput({ capturedAt: new Date(Date.now() - 60 * 60_000).toISOString() })).error, /fresh photo/i);
});

test('AI mismatch or uncertainty is sent to human review', () => {
  const result = { is_civic_issue: true, category: 'garbage', description_matches: false, human_review: false, image_quality: 'good', confidence: 91 };
  assert.deepEqual(classifyAnalysis(result, 'pothole'), { categoryMatches: false, descriptionMatches: false, needsReview: true });
  assert.equal(classifyAnalysis({ ...result, category: 'pothole', description_matches: true, authenticityStatus: 'LIKELY_REAL_SCENE', needsHumanReview: false }, 'pothole').needsReview, false);
  assert.equal(classifyAnalysis({ ...result, image_quality: 'blurry', category: 'pothole', description_matches: true }, 'pothole').needsReview, true);
});

test('authenticity risk signals and inconclusive legacy output always require review', () => {
  const base = { is_civic_issue: true, category: 'pothole', description_matches: true, human_review: false, image_quality: 'good', confidence: 91 };
  assert.equal(classifyAnalysis({ ...base, authenticityStatus: 'LIKELY_REAL_SCENE', needsHumanReview: false }, 'pothole').needsReview, false);
  for (const authenticityStatus of ['POSSIBLE_SCREEN_PHOTO', 'POSSIBLE_PRINTED_PHOTO', 'INCONCLUSIVE', undefined]) {
    assert.equal(classifyAnalysis({ ...base, authenticityStatus, needsHumanReview: authenticityStatus !== undefined }, 'pothole').needsReview, true);
  }
});

test('citizen UI categories map to the stored API category enum', () => {
  assert.equal(toServerCategory('roads'), 'road_damage');
  assert.equal(toServerCategory('streetlights'), 'streetlight');
  assert.equal(toServerCategory('garbage'), 'garbage');
});

test('uploaded image validation rejects MIME spoofing and accepts valid JPEG signature', async () => {
  await assert.rejects(validateUploadedImage({ mimetype: 'image/jpeg', buffer: Buffer.from('not an image') }), /contents do not match/);
  const jpeg = { mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]) };
  assert.equal((await validateUploadedImage(jpeg)).mime, 'image/jpeg');
});

test('image storage writes metadata and bytes to the backend filesystem and supports cleanup', async () => {
  const image = { mimetype: 'image/jpeg', size: 4, buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]) };
  const metadata = await saveImage(image);
  try {
    assert.equal(metadata.storage, 'local');
    assert.match(metadata.key, /^[0-9a-f-]{36}\.jpg$/i);
    assert.deepEqual((await fetchImage(metadata.url)).buffer, image.buffer);
  } finally {
    await deleteImage(metadata);
  }
  await assert.rejects(fetchImage(metadata.url));
});
