import { createRequire } from 'module';
import { DashboardSnapshot } from './dashboard.model.js';

const require = createRequire(import.meta.url);
const { normalizeDashboard } = require('../../../../shared/calculations.js');

export async function saveDashboardSnapshot(scope, summary = {}, shift = {}) {
  const metrics = normalizeDashboard(summary);
  return DashboardSnapshot.findOneAndUpdate(
    scope,
    {
      ...scope,
      shiftId: shift.id ?? summary.shift?.id,
      shiftType: shift.shift_type ?? summary.shift?.shift_type,
      employee1: shift.employee_1 ?? summary.shift?.employee_1,
      employee2: shift.employee_2 ?? summary.shift?.employee_2,
      metrics,
      sourceUpdatedAt: new Date(),
      schemaVersion: 1,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export function getDashboardSnapshot(scope) {
  return DashboardSnapshot.findOne(scope).lean();
}
