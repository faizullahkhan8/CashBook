import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { emitToScope } from '../../core/events/socket.js';
import { SupplierBill } from './supplier-bill.model.js';
import { SupplierPayment } from './supplier-payment.model.js';
import { billAmounts, queryReport, summarize } from './supplier.service.js';

const router = Router();
const scope = (req) => ({ pharmacyId: String(req.query.pharmacyId || req.body?.pharmacyId || env.defaultPharmacyId), branchId: String(req.query.branchId || req.body?.branchId || env.defaultBranchId) });
const emit = (name, sc, entity) => emitToScope(name, { ...sc, entity, at: new Date().toISOString() });

router.get('/bills', async (req, res, next) => { try { const items = await queryReport(scope(req), req.query); res.json({ data: { items, summary: summarize(items) } }); } catch (e) { next(e); } });
router.post('/bills', async (req, res, next) => { try {
  const sc = scope(req); const syncId = String(req.body.syncId || crypto.randomUUID());
  const duplicate = await SupplierBill.findOne({ ...sc, supplierName: req.body.supplierName, supplierBillNo: req.body.supplierBillNo, deletedAt: null });
  if (duplicate && duplicate.syncId !== syncId) return res.status(409).json({ message: 'Supplier bill number already exists for this supplier' });
  const data = { ...req.body, ...billAmounts(req.body), ...sc, syncId, deletedAt: null };
  const item = await SupplierBill.findOneAndUpdate({ ...sc, syncId }, data, { upsert: true, new: true }).lean(); emit('v1.supplier-bill.updated', sc, item); res.status(201).json({ data: item });
} catch (e) { next(e); } });
router.patch('/bills/:syncId', async (req, res, next) => { try { const sc = scope(req); const current = await SupplierBill.findOne({ ...sc, syncId: req.params.syncId }).lean(); if (!current) return res.status(404).json({ message: 'Bill not found' }); const merged = { ...current, ...req.body }; const item = await SupplierBill.findOneAndUpdate({ ...sc, syncId: req.params.syncId }, { ...req.body, ...billAmounts(merged) }, { new: true }).lean(); emit('v1.supplier-bill.updated', sc, item); return res.json({ data: item }); } catch (e) { return next(e); } });
router.delete('/bills/:syncId', async (req, res, next) => { try { const sc = scope(req); const item = await SupplierBill.findOneAndUpdate({ ...sc, syncId: req.params.syncId }, { deletedAt: new Date() }, { new: true }).lean(); emit('v1.supplier-bill.deleted', sc, item); res.json({ data: item }); } catch (e) { next(e); } });

router.get('/payments', async (req, res, next) => { try { res.json({ data: await SupplierPayment.find({ ...scope(req), deletedAt: null }).sort({ paymentDate: -1 }).lean() }); } catch (e) { next(e); } });
router.post('/payments', async (req, res, next) => { try { const sc = scope(req); const syncId = String(req.body.syncId || crypto.randomUUID()); const item = await SupplierPayment.findOneAndUpdate({ ...sc, syncId }, { ...req.body, ...sc, syncId, amount: Number(req.body.amount), deletedAt: null }, { upsert: true, new: true }).lean(); emit('v1.supplier-payment.updated', sc, item); res.status(201).json({ data: item }); } catch (e) { next(e); } });
router.delete('/payments/:syncId', async (req, res, next) => { try { const sc = scope(req); const item = await SupplierPayment.findOneAndUpdate({ ...sc, syncId: req.params.syncId }, { deletedAt: new Date() }, { new: true }).lean(); emit('v1.supplier-payment.deleted', sc, item); res.json({ data: item }); } catch (e) { next(e); } });
router.get('/summary', async (req, res, next) => { try { const items = await queryReport(scope(req), req.query); res.json({ data: summarize(items) }); } catch (e) { next(e); } });
router.get('/daily', async (req, res, next) => { try { const sc = scope(req); const items = await queryReport(sc, req.query); const groups = items.reduce((m, b) => { const date = req.query.dateType === 'bill' ? b.billDate : b.postingDate; (m[date] ||= { date, items: [], payments: [] }).items.push(b); return m; }, {}); const paymentFilter = { ...sc, deletedAt: null, paymentDate: { ...(req.query.from ? { $gte: req.query.from } : {}), ...(req.query.to ? { $lte: req.query.to } : {}) } }; const payments = await SupplierPayment.find(paymentFilter).lean(); payments.forEach((p) => (groups[p.paymentDate] ||= { date: p.paymentDate, items: [], payments: [] }).payments.push(p)); const data = Object.values(groups).map((g) => ({ ...g, summary: { ...summarize(g.items), paymentsMade: g.payments.reduce((n, p) => n + Number(p.amount || 0), 0) } })); res.json({ data: data.sort((a, b) => b.date.localeCompare(a.date)) }); } catch (e) { next(e); } });
router.get('/names', async (req, res, next) => { try { res.json({ data: await SupplierBill.distinct('supplierName', { ...scope(req), deletedAt: null }) }); } catch (e) { next(e); } });
export default router;
