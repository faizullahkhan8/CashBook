import { SupplierBill } from './supplier-bill.model.js';
import { SupplierPayment } from './supplier-payment.model.js';

export const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
export function billAmounts(input) {
  const total = money(input.totalBillAmount);
  const taxPercent = Number(input.taxPercent) || 0;
  const taxAmount = money(total * taxPercent / 100);
  return { totalBillAmount: total, taxPercent, taxAmount, actualAmount: money(total - taxAmount) };
}
export function decorateBills(bills, payments) {
  const byBill = payments.reduce((map, p) => { map[p.billSyncId] = (map[p.billSyncId] || 0) + Number(p.amount || 0); return map; }, {});
  return bills.map((bill) => {
    const paidAmount = money(byBill[bill.syncId] || 0);
    const excluded = bill.category !== 'PAYABLE';
    const remainingBalance = excluded ? 0 : money(Math.max(0, bill.actualAmount - paidAmount));
    const paymentStatus = excluded ? bill.category : paidAmount <= 0 ? 'UNPAID' : remainingBalance > 0 ? 'PARTIAL' : paidAmount > bill.actualAmount ? 'OVERPAID' : 'COMPLETE';
    return { ...bill, paidAmount, remainingBalance, paymentStatus };
  });
}
export async function queryReport(scope, query = {}) {
  const dateField = query.dateType === 'bill' ? 'billDate' : 'postingDate';
  const filter = { ...scope, deletedAt: null };
  if (query.from || query.to) filter[dateField] = { ...(query.from ? { $gte: query.from } : {}), ...(query.to ? { $lte: query.to } : {}) };
  if (query.supplier) filter.supplierName = query.supplier;
  const bills = await SupplierBill.find(filter).sort({ [dateField]: -1, createdAt: -1 }).lean();
  const payments = await SupplierPayment.find({ ...scope, deletedAt: null, billSyncId: { $in: bills.map((b) => b.syncId) } }).lean();
  return decorateBills(bills, payments);
}
export function summarize(items) {
  return items.reduce((s, b) => ({
    totalBills: s.totalBills + 1, grossAmount: money(s.grossAmount + b.totalBillAmount), taxDeduction: money(s.taxDeduction + b.taxAmount),
    actualPayable: money(s.actualPayable + (b.category === 'PAYABLE' ? b.actualAmount : 0)), totalPaid: money(s.totalPaid + b.paidAmount),
    outstandingBalance: money(s.outstandingBalance + b.remainingBalance), pendingBills: s.pendingBills + (['UNPAID', 'PARTIAL'].includes(b.paymentStatus) ? 1 : 0),
    overdueBills: s.overdueBills + (b.remainingBalance > 0 && b.billDate < new Date().toISOString().slice(0, 10) ? 1 : 0),
  }), { totalBills: 0, grossAmount: 0, taxDeduction: 0, actualPayable: 0, totalPaid: 0, outstandingBalance: 0, pendingBills: 0, overdueBills: 0 });
}
