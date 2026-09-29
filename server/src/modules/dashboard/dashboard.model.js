import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pharmacyId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  shiftId: { type: mongoose.Schema.Types.Mixed },
  shiftType: String,
  employee1: String,
  employee2: String,
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourceUpdatedAt: Date,
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

schema.index({ pharmacyId: 1, branchId: 1 }, { unique: true });
export const DashboardSnapshot = mongoose.model('DashboardSnapshot', schema);
