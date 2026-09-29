import { ShiftClosing } from './closing.model.js';

export function mapClosing(scope, entity) {
  return {
    ...scope,
    syncId: String(entity.sync_id || entity.id || entity.closing_code),
    localId: entity.id,
    closingCode: entity.closing_code,
    shiftId: entity.shift_id,
    shiftType: entity.shift_type,
    employee1: entity.employee_1,
    employee2: entity.employee_2,
    closedAt: entity.closed_at,
    isVoid: Boolean(Number(entity.is_void)),
    raw: entity,
  };
}

export async function upsertClosing(scope, entity) {
  const data = mapClosing(scope, entity);
  return ShiftClosing.findOneAndUpdate(
    { ...scope, syncId: data.syncId },
    data,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export function listClosings(scope, limit = 50) {
  return ShiftClosing.find(scope).sort({ closedAt: -1, createdAt: -1 }).limit(limit).lean();
}

export function getClosing(scope, id) {
  return ShiftClosing.findOne({ ...scope, $or: [{ syncId: id }, { closingCode: id }] }).lean();
}
