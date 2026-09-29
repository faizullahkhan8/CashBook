import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  eventId: { type: String, unique: true, required: true },
  eventType: { type: String, required: true },
  eventVersion: { type: Number, default: 1 },
  pharmacyId: String,
  branchId: String,
  occurredAt: Date,
}, { timestamps: true });

export const SyncEvent = mongoose.model('SyncEvent', schema);
