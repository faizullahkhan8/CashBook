import { LedgerEntry } from '../ledger/ledger.model.js';
import { ShortItem } from '../short-items/short-item.model.js';
import { upsertClosing } from '../closings/closing.service.js';
import { saveDashboardSnapshot } from '../dashboard/dashboard.service.js';
import { SyncEvent } from './sync-event.model.js';
import { emitToScope } from '../../core/events/socket.js';

function syncId(entity) {
  return String(entity?.sync_id || entity?.id || entity?.closing_code || 'unknown');
}

async function upsertLedger(scope, entity, deleted = false) {
  if (!entity) return null;
  return LedgerEntry.findOneAndUpdate(
    { ...scope, syncId: syncId(entity) },
    {
      ...scope,
      syncId: syncId(entity),
      localId: entity.id,
      shiftId: entity.shift_id,
      invoiceNumber: entity.invoice_number,
      amount: Number(entity.amount || 0),
      paymentMethod: entity.payment_method,
      notes: entity.notes,
      employee1: entity.employee_1,
      employee2: entity.employee_2,
      occurredAt: entity.created_at,
      deletedAt: deleted ? new Date() : null,
      raw: entity,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

async function upsertShortItem(scope, entity, deleted = false) {
  if (!entity) return null;
  return ShortItem.findOneAndUpdate(
    { ...scope, syncId: syncId(entity) },
    {
      ...scope,
      syncId: syncId(entity),
      localId: entity.id,
      shiftId: entity.shift_id,
      amount: Number(entity.amount || 0),
      billAmount: Number(entity.bill_amount || 0),
      returnedAmount: Number(entity.returned_amount || 0),
      givenTo: entity.given_to,
      pharmacy: entity.pharmacy,
      referenceNo: entity.reference_no,
      status: entity.status,
      occurredAt: entity.created_at,
      deletedAt: deleted ? new Date() : null,
      raw: entity,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function processSyncEvent(event) {
  const existing = await SyncEvent.findOne({ eventId: event.eventId }).lean();
  if (existing) return { duplicate: true };

  const scope = { pharmacyId: event.pharmacyId, branchId: event.branchId };
  const entity = event.payload?.entity;
  if (event.eventType.includes('ledger.')) await upsertLedger(scope, entity, event.eventType.endsWith('.deleted'));
  if (event.eventType.includes('short-item.')) await upsertShortItem(scope, entity, event.eventType.endsWith('.deleted'));
  if (event.eventType.includes('closing.') && entity) await upsertClosing(scope, entity);

  let dashboard = null;
  if (event.payload?.summary) {
    dashboard = await saveDashboardSnapshot(scope, event.payload.summary, event.payload.shift || {});
    emitToScope('v1.dashboard.updated', dashboard);
  }

  await SyncEvent.create({
    eventId: event.eventId,
    eventType: event.eventType,
    eventVersion: event.eventVersion || 1,
    ...scope,
    occurredAt: event.occurredAt,
  });
  emitToScope(event.eventType, { ...scope, entity, dashboard, occurredAt: event.occurredAt });
  return { duplicate: false, dashboard };
}

export async function processBootstrap(data) {
  const scope = { pharmacyId: data.pharmacyId, branchId: data.branchId };
  await Promise.all((data.ledgers || []).map((entity) => upsertLedger(scope, entity)));
  await Promise.all((data.shortItems || []).map((entity) => upsertShortItem(scope, entity)));
  await Promise.all((data.closings || []).map((entity) => upsertClosing(scope, entity)));
  const dashboard = await saveDashboardSnapshot(scope, data.summary || {}, data.shift || {});
  emitToScope('v1.dashboard.updated', dashboard);
  return dashboard;
}
