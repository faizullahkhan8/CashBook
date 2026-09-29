import { Router } from 'express';
import { env } from '../../config/env.js';
import { getClosing, listClosings } from './closing.service.js';
import { LedgerEntry } from '../ledger/ledger.model.js';
import { ShortItem } from '../short-items/short-item.model.js';

const router = Router();
const scopeFrom = (req) => ({
  pharmacyId: String(req.query.pharmacyId || env.defaultPharmacyId),
  branchId: String(req.query.branchId || env.defaultBranchId),
});

router.get('/', async (req, res, next) => {
  try {
    const scope = scopeFrom(req);
    const items = await listClosings(scope, Math.min(Number(req.query.limit || 50), 200));
    const shortItems = await ShortItem.find({ ...scope, shiftId: { $in: items.map((item) => item.shiftId) }, deletedAt: null }).lean();
    const shortByShift = shortItems.reduce((totals, item) => {
      const amount = item.status === 'RETURNED' ? Number(item.billAmount || 0) : Number(item.amount || 0);
      totals[String(item.shiftId)] = (totals[String(item.shiftId)] || 0) + amount;
      return totals;
    }, {});
    res.json({ data: { items: items.map((item) => ({ ...item, shortItemsAmount: shortByShift[String(item.shiftId)] || 0 })) } });
  }
  catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const item = await getClosing(scopeFrom(req), req.params.id);
    if (!item) return res.status(404).json({ message: 'Closing not found' });
    const totals = await LedgerEntry.aggregate([
      { $match: { pharmacyId: item.pharmacyId, branchId: item.branchId, shiftId: item.shiftId, deletedAt: null } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
    ]);
    const byMethod = Object.fromEntries(totals.map((row) => [row._id, row.total]));
    const shortItems = await ShortItem.find({ pharmacyId: item.pharmacyId, branchId: item.branchId, shiftId: item.shiftId, deletedAt: null }).lean();
    const shortItemsAmount = shortItems.reduce((total, shortItem) => total + (shortItem.status === 'RETURNED' ? Number(shortItem.billAmount || 0) : Number(shortItem.amount || 0)), 0);
    return res.json({ data: { ...item, shortItemsAmount, paymentBreakdown: { card: byMethod.CARD || 0, qr: byMethod.QR_CODE || 0, cash: byMethod.CASH || 0 } } });
  } catch (error) { return next(error); }
});
export default router;
