import { CATEGORIES, MAX_LOCATION_ACCURACY_M } from './constants.js';

const CATEGORY_ALIASES = {
  roads: 'road_damage', streetlights: 'streetlight', drainage: 'waterlogging',
  water_supply: 'water_leakage', parks: 'fallen_tree', public_safety: 'other',
};
export const toServerCategory = category => CATEGORY_ALIASES[category] || category;

export function validateReportInput(body) {
  if (!String(body.lat ?? '').trim() || !String(body.lng ?? '').trim()) return { error: 'A valid device location is required' };
  const latitude = Number(body.lat);
  const longitude = Number(body.lng);
  const accuracy = Number(body.locationAccuracy);
  const capturedAt = new Date(body.capturedAt);
  const clientSubmittedAt = new Date(body.submittedAt);
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!CATEGORIES.includes(body.category)) return { error: 'Select a valid problem category' };
  if (description.length < 10 || description.length > 1000) return { error: 'Describe the problem in 10 to 1000 characters' };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    return { error: 'A valid device location is required' };
  if (!Number.isFinite(accuracy) || accuracy <= 0 || accuracy > MAX_LOCATION_ACCURACY_M)
    return { error: `Location accuracy must be ${MAX_LOCATION_ACCURACY_M} metres or better` };
  if (!Number.isFinite(capturedAt.getTime()) || capturedAt.getTime() > Date.now() + 60_000 || Date.now() - capturedAt.getTime() > 30 * 60_000)
    return { error: 'Capture a fresh photo before submitting' };
  if (!Number.isFinite(clientSubmittedAt.getTime()) || clientSubmittedAt.getTime() > Date.now() + 60_000)
    return { error: 'Invalid submission timestamp' };
  if (!/^[0-9a-f-]{36}$/i.test(body.submissionId || '')) return { error: 'Invalid submission identifier' };

  return { latitude, longitude, accuracy, capturedAt, clientSubmittedAt, description };
}

export function classifyAnalysis(result, selectedCategory) {
  const categoryMatches = result.category === selectedCategory;
  const descriptionMatches = result.description_matches !== false;
  const authenticityStatus = ['LIKELY_REAL_SCENE', 'POSSIBLE_SCREEN_PHOTO', 'POSSIBLE_PRINTED_PHOTO', 'INCONCLUSIVE'].includes(result.authenticityStatus)
    ? result.authenticityStatus : 'INCONCLUSIVE';
  const authenticityNeedsReview = result.needsHumanReview === true || authenticityStatus !== 'LIKELY_REAL_SCENE';
  const needsReview = result.is_civic_issue === false || !categoryMatches || !descriptionMatches ||
    result.human_review === true || result.image_quality !== 'good' || result.confidence < 55 || authenticityNeedsReview;
  return { categoryMatches, descriptionMatches, needsReview };
}
