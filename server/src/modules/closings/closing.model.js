import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pharmacyId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  syncId: { type: String, required: true },
  localId: mongoose.Schema.Types.Mixed,
  closingCode: String,
  shiftId: mongoose.Schema.Types.Mixed,
  shiftType: String,
  employee1: String,
  employee2: String,
  closedAt: Date,
  isVoid: Boolean,
  raw: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

schema.index({ pharmacyId: 1, branchId: 1, syncId: 1 }, { unique: true });
export const ShiftClosing = mongoose.model('CeoShiftClosing', schema);
