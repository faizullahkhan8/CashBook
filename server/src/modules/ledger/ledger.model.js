import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pharmacyId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  syncId: { type: String, required: true },
  localId: mongoose.Schema.Types.Mixed,
  shiftId: mongoose.Schema.Types.Mixed,
  invoiceNumber: String,
  amount: Number,
  paymentMethod: String,
  notes: String,
  employee1: String,
  employee2: String,
  occurredAt: Date,
  deletedAt: Date,
  raw: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

schema.index({ pharmacyId: 1, branchId: 1, syncId: 1 }, { unique: true });
export const LedgerEntry = mongoose.model('CeoLedgerEntry', schema);
