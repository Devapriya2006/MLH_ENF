import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  department: String,
  phone: { type: String, trim: true, maxlength: 40 },
  location: { type: String, trim: true, maxlength: 120 },
  fullAddress: { type: String, trim: true, maxlength: 300 },
  idProofType: { type: String, trim: true, maxlength: 40 },
  idProofNumber: { type: String, trim: true, maxlength: 80 },
  gender: { type: String, trim: true, maxlength: 40 },
  dob: Date,
  points: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('User', userSchema);
