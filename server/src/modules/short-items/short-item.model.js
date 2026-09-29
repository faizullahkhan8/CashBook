import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pharmacyId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  syncId: { type: String, required: true },
  localId: mongoose.Schema.Types.Mixed,
  shiftId: mongoose.Schema.Types.Mixed,
  amount: Number,
  billAmount: Number,
  returnedAmount: Number,
  givenTo: String,
  pharmacy: String,
  referenceNo: String,
  status: String,
  occurredAt: Date,
  deletedAt: Date,
  raw: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

schema.index({ pharmacyId: 1, branchId: 1, syncId: 1 }, { unique: true });
export const ShortItem = mongoose.model('CeoShortItem', schema);
