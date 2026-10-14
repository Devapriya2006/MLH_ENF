import mongoose from 'mongoose';
import { CATEGORIES, STATUSES } from '../utils/constants.js';
const { Schema } = mongoose;

const complaintSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ticketId: { type: String, unique: true, sparse: true },
  submissionId: { type: String, unique: true, sparse: true },
  category: { type: String, enum: CATEGORIES, required: true },
  aiCategory: { type: String, enum: CATEGORIES },
  authenticityStatus: { type: String, enum: ['LIKELY_REAL_SCENE', 'POSSIBLE_SCREEN_PHOTO', 'POSSIBLE_PRINTED_PHOTO', 'INCONCLUSIVE'], default: 'INCONCLUSIVE' },
  authenticityConfidence: { type: Number, min: 0, max: 100, default: 0 },
  authenticityReason: String,
  issueDetected: Boolean,
  categoryMatches: Boolean,
  descriptionMatches: Boolean,
  humanReview: { type: Boolean, default: false },
  aiObservations: String,
  aiConfidence: Number,
  aiModel: String,
  analysisLanguage: { type: String, enum: ['en', 'bn', 'hi'], default: 'en' },
  aiSeverity: { type: Number, default: 0 },
  risk: String,
  department: String,
  title: { type: String, required: true },
  description: String,
  beforeImage: { url: String, key: String, storage: String, mime: String, size: Number },
  analysisStatus: { type: String, enum: ['pending', 'processing', 'completed', 'review_required', 'failed'], default: 'pending' },
  analysisError: String,
  afterImage: { url: String, key: String, storage: String, mime: String, size: Number },
  afterVerdict: { resolved: Boolean, confidence: Number, note: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  address: String,
  locationAccuracy: Number,
  capturedAt: Date,
  submittedAt: Date,
  clientSubmittedAt: Date,
  confirmations: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  confirmationCount: { type: Number, default: 0 },
  resolutionVotes: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, resolved: Boolean }],
  status: { type: String, enum: STATUSES, default: 'reported' },
  statusHistory: [{
    status: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  }],
  assignedTo: String,
  priority: { type: Number, default: 0 },
}, { timestamps: true });

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, priority: -1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ aiSeverity: -1, createdAt: -1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.pre('validate', function(next) {
  if (!this.ticketId && this.isNew) this.ticketId = `CL-${new Date().getFullYear()}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
  next();
});
export default mongoose.model('Complaint', complaintSchema);
