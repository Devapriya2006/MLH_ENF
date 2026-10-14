import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { auth, optionalAuth, adminOnly } from '../middleware/auth.js';
import { upload, validateUploadedImage } from '../middleware/upload.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { analyzeImage, compareImages, MODEL, LANGS } from '../services/vision.js';
import { saveImage, fetchImage, deleteImage } from '../services/storage.js';
import { computePriority } from '../utils/priority.js';
import { CATEGORIES, STATUSES, CLOSED, DEPARTMENTS, DUP_RADIUS, VERIFY_THRESHOLD } from '../utils/constants.js';
import { classifyAnalysis, toServerCategory, validateReportInput } from '../utils/reporting.js';

const router = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const addPoints = (id, n) => User.findByIdAndUpdate(id, { $inc: { points: n } });
const push = (c, status, by) => { c.status = status; c.statusHistory.push({ status, by }); };
const protectImageUrls = complaint => {
  for (const image of [complaint.beforeImage, complaint.afterImage]) {
    if (image?.key) image.url = `/api/complaints/${complaint._id}/image/${image.key}`;
  }
  return complaint;
};

async function analyzeSavedComplaint(id, imageBuffer, mime, lang, category, description) {
  await Complaint.findByIdAndUpdate(id, { analysisStatus: 'processing' });
  try {
    const result = await analyzeImage(imageBuffer, mime, lang, { category, description });
    const { categoryMatches, descriptionMatches, needsReview } = classifyAnalysis(result, category);
    const authenticityStatus = ['LIKELY_REAL_SCENE', 'POSSIBLE_SCREEN_PHOTO', 'POSSIBLE_PRINTED_PHOTO', 'INCONCLUSIVE'].includes(result.authenticityStatus)
      ? result.authenticityStatus : 'INCONCLUSIVE';
    const reviewRequired = needsReview;
    const updates = {
      aiCategory: result.category,
      issueDetected: result.issueDetected === true,
      authenticityStatus,
      authenticityConfidence: result.authenticityConfidence || 0,
      authenticityReason: result.authenticityReason || '',
      categoryMatches,
      descriptionMatches,
      humanReview: reviewRequired,
      aiObservations: result.observations || '',
      aiConfidence: result.confidence,
      aiSeverity: result.severity,
      risk: result.risk,
      aiModel: MODEL(),
      analysisStatus: reviewRequired ? 'review_required' : 'completed',
      analysisError: undefined,
    };
    const complaint = await Complaint.findById(id);
    if (!complaint) return;
    Object.assign(complaint, updates);
    // Keep the citizen's category and description. Only mark clean matches verified.
    if (!reviewRequired) push(complaint, 'ai_verified', null);
    complaint.priority = computePriority(complaint);
    await complaint.save();
  } catch (error) {
    console.error(`AI analysis failed for complaint ${id}:`, error.message);
    await Complaint.findByIdAndUpdate(id, {
      analysisStatus: 'failed',
      humanReview: true,
      analysisError: 'AI analysis is temporarily unavailable. The report is saved and can be retried.',
    });
  }
}

// ---- 1. AI analysis + duplicate detection (does not save a complaint) ----
router.post('/analyze', optionalAuth, rateLimit(), upload.single('image'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  await validateUploadedImage(req.file);
  const lat = parseFloat(req.body.lat), lng = parseFloat(req.body.lng);
  const lang = LANGS[req.body.lang] ? req.body.lang : 'en';
  const analysis = await analyzeImage(req.file.buffer, req.file.mimetype, lang, {
    category: req.body.category,
    description: req.body.description,
  });
  let duplicates = [];
  if (Number.isFinite(lat) && Number.isFinite(lng) && analysis.is_civic_issue) {
    duplicates = await Complaint.aggregate([
      { $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] }, distanceField: 'distance',
          maxDistance: DUP_RADIUS, spherical: true,
          query: { category: analysis.category, status: { $nin: CLOSED } } } },
      { $limit: 3 },
      { $project: { title: 1, status: 1, confirmationCount: 1, priority: 1, beforeImage: 1, distance: 1 } },
    ]);
  }
  res.json({ analysis, duplicates, model: MODEL() });
}));

// ---- 2. Create complaint with durable image before AI analysis ----
router.post('/', auth, rateLimit(), upload.single('image'), wrap(async (req, res) => {
  await validateUploadedImage(req.file);
  const input = validateReportInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });
  const { category, address, submissionId, title } = req.body;
  if (title && (typeof title !== 'string' || title.trim().length > 120)) return res.status(400).json({ error: 'Title must be 1 to 120 characters' });
  const prior = await Complaint.findOne({ reporter: req.user._id, submissionId });
  if (prior) return res.status(200).json(prior.toObject());
  let savedImage;
  try { savedImage = await saveImage(req.file); }
  catch (e) { throw Object.assign(new Error('Could not store the uploaded image'), { status: 500 }); }
  const c = new Complaint({
    reporter: req.user._id, submissionId, category, title: (title || input.description.slice(0, 80)).trim(), description: input.description, address,
    department: DEPARTMENTS[category] || DEPARTMENTS.other, beforeImage: savedImage,
    location: { type: 'Point', coordinates: [input.longitude, input.latitude] },
    locationAccuracy: input.accuracy, capturedAt: input.capturedAt, submittedAt: new Date(), clientSubmittedAt: input.clientSubmittedAt,
    analysisLanguage: LANGS[req.body.lang] ? req.body.lang : 'en',
    status: 'reported', analysisStatus: 'pending', statusHistory: [{ status: 'reported', by: req.user._id }],
  });
  c.priority = computePriority(c);
  try { await c.save(); }
  catch (e) {
    await deleteImage(savedImage);
    if (e.code === 11000) {
      const duplicate = await Complaint.findOne({ reporter: req.user._id, submissionId });
      if (duplicate) return res.status(200).json(duplicate.toObject());
    }
    throw e;
  }
  // Return the durable ticket immediately; Ollama runs after the response.
  res.status(201).json(c.toObject());
  setImmediate(() => {
    addPoints(req.user._id, 10).catch(error => console.error('Could not award report points:', error.message));
    analyzeSavedComplaint(c._id, req.file.buffer, req.file.mimetype, req.body.lang || 'en', category, input.description)
      .catch(error => console.error('Background complaint analysis failed:', error.message));
  });
}));

// ---- 3. List (map + dashboard) ----
router.get('/', wrap(async (req, res) => {
  const { category, status, minSeverity, active, sort } = req.query;
  const isPaginated = req.query.page !== undefined;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || (isPaginated ? 50 : 300)));
  const q = {};
  const normalizedCategory = toServerCategory(category);
  if (CATEGORIES.includes(normalizedCategory)) q.category = normalizedCategory;
  if (status === 'submitted') q.status = { $in: ['reported', 'ai_verified', 'assigned'] };
  else if (status === 'resolved') q.status = { $in: CLOSED };
  else if (STATUSES.includes(status)) q.status = status;
  else if (active === '1') q.status = { $nin: CLOSED };
  if (minSeverity !== undefined && minSeverity !== '') {
    const severity = Number(minSeverity);
    if (!Number.isFinite(severity) || severity < 0 || severity > 100) return res.status(400).json({ error: 'Severity filter must be between 0 and 100' });
    q.aiSeverity = { $gte: severity };
  }
  const query = Complaint.find(q)
    .sort(sort === 'recent' ? { createdAt: -1 } : { priority: -1, createdAt: -1 })
    .skip(isPaginated ? (page - 1) * limit : 0).limit(isPaginated ? limit : 300)
    .select('-statusHistory -resolutionVotes -confirmations -description -submissionId -clientSubmittedAt').lean();
  const [items, total] = await Promise.all([query, isPaginated ? Complaint.countDocuments(q) : Promise.resolve(null)]);
  const safeItems = items.map(item => protectImageUrls(item));
  res.json(isPaginated ? { items: safeItems, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } : safeItems);
}));

// ---- 4. Admin stats + leaderboard (before /:id) ----
router.get('/stats', auth, adminOnly, wrap(async (_req, res) => {
  const [summary] = await Complaint.aggregate([
    { $project: { category: 1, status: 1, priority: 1, aiSeverity: 1, createdAt: 1, statusHistory: 1 } },
    { $facet: {
      totals: [{ $group: { _id: null, total: { $sum: 1 }, open: { $sum: { $cond: [{ $not: [{ $in: ['$status', CLOSED] }] }, 1, 0] } } } }],
      categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      severity: [{ $group: { _id: { $switch: { branches: [
        { case: { $lt: [{ $ifNull: ['$aiSeverity', 0] }, 34] }, then: 'minor' },
        { case: { $lt: [{ $ifNull: ['$aiSeverity', 0] }, 67] }, then: 'moderate' },
      ], default: 'urgent' } }, count: { $sum: 1 } } }],
      critical: [{ $match: { priority: { $gte: 70 }, status: { $nin: CLOSED } } }, { $count: 'count' }],
      resolved: [{ $match: { status: { $in: CLOSED } } }, { $unwind: '$statusHistory' }, { $match: { 'statusHistory.status': 'resolved' } }, { $group: { _id: null, hours: { $avg: { $divide: [{ $subtract: ['$statusHistory.at', '$createdAt'] }, 3600000] } } } }],
    } },
  ]);
  const item = summary || { totals: [], categories: [], statuses: [], severity: [], critical: [], resolved: [] };
  res.json({
    total: item.totals[0]?.total || 0,
    open: item.totals[0]?.open || 0,
    critical: item.critical[0]?.count || 0,
    byCategory: Object.fromEntries(item.categories.map(row => [row._id, row.count])),
    byStatus: Object.fromEntries(item.statuses.map(row => [row._id, row.count])),
    bySeverity: Object.fromEntries((item.severity || []).map(row => [row._id, row.count])),
    avgResolutionHours: item.resolved[0] ? Math.round(item.resolved[0].hours) : null,
  });
}));

router.get('/leaderboard', wrap(async (_req, res) => {
  res.json(await User.find({ role: 'citizen', points: { $gt: 0 } }).sort({ points: -1 }).limit(10).select('name points').lean());
}));

router.get('/mine/summary', auth, wrap(async (req, res) => {
  const summary = await Complaint.aggregate([
    { $match: { reporter: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries((summary || []).map(row => [row._id, row.count]));
  res.json({
    submitted: counts.reported || 0,
    inProgress: (counts.ai_verified || 0) + (counts.assigned || 0) + (counts.in_progress || 0),
    resolved: (counts.resolved || 0) + (counts.citizen_verified || 0),
  });
}));

router.post('/:id/analysis/retry', auth, rateLimit({ max: 3, windowMs: 10 * 60 * 1000 }), wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  const isAdmin = req.user.role === 'admin';
  const isReporter = c.reporter.equals(req.user._id);
  if (!isAdmin && !isReporter) return res.status(403).json({ error: 'Only the reporter or an administrator can retry analysis' });
  if (c.analysisStatus !== 'failed' && !(isAdmin && c.analysisStatus === 'review_required'))
    return res.status(409).json({ error: 'Only failed analysis can be retried by the reporter' });
  const image = await fetchImage(c.beforeImage?.url);
  c.analysisStatus = 'pending';
  c.analysisError = undefined;
  await c.save();
  res.status(202).json({ id: c._id, analysisStatus: c.analysisStatus });
  setImmediate(() => analyzeSavedComplaint(c._id, image.buffer, image.mime, c.analysisLanguage || 'en', c.category, c.description)
    .catch(error => console.error('Analysis retry failed:', error.message)));
}));

router.get('/map', wrap(async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng), radius = Math.max(0, Math.min(Number(req.query.radius) || 5000, 50000));
  const q = { status: { $nin: CLOSED } };
  const normalizedCategory = toServerCategory(req.query.category);
  if (CATEGORIES.includes(normalizedCategory)) q.category = normalizedCategory;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: 'Invalid coordinates' });
    q.location = { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } };
  }
  const items = await Complaint.find(q).sort({ priority: -1, createdAt: -1 }).limit(300).select('title category status priority location address beforeImage createdAt').lean();
  res.json(items.map(item => protectImageUrls(item)));
}));

router.get('/:id/activity', optionalAuth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id).select('statusHistory').populate('statusHistory.by', 'name');
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  res.json(c.statusHistory);
}));

// ---- 5. Detail ----
router.get('/:id', optionalAuth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id).populate('reporter', 'name').populate('statusHistory.by', 'name');
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  const o = c.toObject(); const me = req.user?._id;
  delete o.submissionId;
  if (o.beforeImage?.key) o.beforeImage.url = `/api/complaints/${c._id}/image/${o.beforeImage.key}`;
  if (o.afterImage?.key) o.afterImage.url = `/api/complaints/${c._id}/image/${o.afterImage.key}`;
  o.confirmedByMe = !!me && c.confirmations.some(id => id.equals(me));
  o.myVote = me ? c.resolutionVotes.find(v => v.user.equals(me))?.resolved ?? null : null;
  o.votes = { yes: c.resolutionVotes.filter(v => v.resolved).length, no: c.resolutionVotes.filter(v => !v.resolved).length };
  delete o.confirmations; delete o.resolutionVotes;
  res.json(o);
}));

router.get('/:id/analysis', optionalAuth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id).select('analysisStatus analysisError aiConfidence aiSeverity aiModel risk category aiCategory categoryMatches descriptionMatches humanReview aiObservations department issueDetected authenticityStatus authenticityConfidence authenticityReason');
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  res.json({ ...c.toObject(), selectedCategory: c.category, predictedCategory: c.aiCategory, reason: c.authenticityReason, needsHumanReview: c.humanReview });
}));

router.get('/:id/image/:imageId', auth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id).select('reporter beforeImage afterImage');
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  const image = [c.beforeImage, c.afterImage].find(item => item?.key === req.params.imageId);
  if (!image) return res.status(404).json({ error: 'Image not found' });
  if (req.user.role !== 'admin' && !c.reporter.equals(req.user._id)) return res.status(403).json({ error: 'Image access denied' });
  const { buffer, mime } = await fetchImage(image.url);
  res.set('Content-Type', mime).set('Cache-Control', 'private, max-age=300').send(buffer);
}));

// ---- 6. Community verification ----
router.post('/:id/confirm', auth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  if (CLOSED.includes(c.status)) return res.status(400).json({ error: 'This issue is already resolved' });
  if (c.reporter.equals(req.user._id) || c.confirmations.some(id => id.equals(req.user._id)))
    return res.status(400).json({ error: 'You have already supported this complaint' });
  c.confirmations.push(req.user._id);
  c.confirmationCount = c.confirmations.length;
  c.priority = computePriority(c);
  await c.save();
  await addPoints(req.user._id, 2);
  res.json({ confirmationCount: c.confirmationCount, priority: c.priority });
}));

// ---- 7. Admin: status / assignment ----
router.patch('/:id/status', auth, adminOnly, wrap(async (req, res) => {
  const { status, assignedTo } = req.body;
  if (!STATUSES.includes(status) || ['resolved', 'citizen_verified'].includes(status))
    return res.status(400).json({ error: 'Use the resolve action to close an issue' });
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  push(c, status, req.user._id);
  if (status === 'assigned') c.assignedTo = assignedTo || c.department;
  c.priority = computePriority(c);
  await c.save();
  res.json({ status: c.status, assignedTo: c.assignedTo });
}));

// ---- 8. Admin: upload after-photo → AI before/after comparison ----
router.post('/:id/resolve', auth, adminOnly, upload.single('image'), wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  if (!req.file) return res.status(400).json({ error: 'After-repair photo is required' });
  const [after, before] = await Promise.all([
    saveImage(req.file),
    c.beforeImage?.url ? fetchImage(c.beforeImage.url).catch(() => null) : null,
  ]);
  c.afterImage = after;
  c.afterVerdict = before
    ? await compareImages(before, { buffer: req.file.buffer, mime: req.file.mimetype }, c.category)
    : { resolved: true, confidence: 0, note: 'No before-photo available for comparison.' };
  c.resolutionVotes = [];
  push(c, 'resolved', req.user._id);
  c.priority = computePriority(c);
  await c.save();
  res.json({ status: c.status, afterImage: c.afterImage, afterVerdict: c.afterVerdict });
}));

// ---- 9. Citizens verify the repair ----
router.post('/:id/verify-resolution', auth, wrap(async (req, res) => {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  if (c.status !== 'resolved') return res.status(400).json({ error: 'Nothing to verify right now' });
  if (c.resolutionVotes.some(v => v.user.equals(req.user._id))) return res.status(400).json({ error: 'You already voted' });
  c.resolutionVotes.push({ user: req.user._id, resolved: !!req.body.resolved });
  const yes = c.resolutionVotes.filter(v => v.resolved).length;
  const no = c.resolutionVotes.length - yes;
  if (yes >= VERIFY_THRESHOLD) { push(c, 'citizen_verified', req.user._id); await addPoints(c.reporter, 5); }
  else if (no >= VERIFY_THRESHOLD) { push(c, 'in_progress', req.user._id); c.resolutionVotes = []; c.priority = computePriority(c); }
  await c.save();
  await addPoints(req.user._id, 3);
  res.json({ status: c.status });
}));

export default router;
