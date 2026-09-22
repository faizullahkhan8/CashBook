import React, { useMemo } from 'react';
import { ArrowLeftRight, Building2, FileText, Receipt } from 'lucide-react';

export default function ReturnShortItemModal({ state, setState, currency, pharmacyOptions = [], submitting, onClose, onSubmit }) {
  const item = state.item;
  const returnedAmount = useMemo(() => {
    if (!item) return 0;
    const bill = Number(state.billAmount);
    return Math.max(0, Number(item.amount || 0) - (Number.isFinite(bill) ? bill : 0));
  }, [item, state.billAmount]);

  if (!state.open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-up">
        <div className="bg-[#27325b] px-8 py-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            Settle Short Item Purchase
          </h3>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-7">
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 text-sm">
            <div><span className="block text-xs text-slate-500">Given To</span><span className="font-bold text-slate-800 dark:text-slate-100">{item.given_to}</span></div>
            <div className="text-right"><span className="block text-xs text-slate-500">Amount Given</span><span className="font-black text-rose-600">{currency} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Bill Amount ({currency})</label>
              <div className="relative">
                <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input type="number" required min="0" max={item.amount} step="0.01" value={state.billAmount} onChange={(e) => setState({ ...state, billAmount: e.target.value })} className="w-full h-16 pl-12 pr-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-2xl font-black font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="0.00" autoFocus />
              </div>
            </div>
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3.5">
              <span className="block text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Returned Amount</span>
              <span className="block mt-1 text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300">{currency} {returnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] font-bold text-emerald-600">Given − Bill Amount</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Invoice / Reference No.</label>
              <div className="relative"><FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" required value={state.referenceNo} onChange={(e) => setState({ ...state, referenceNo: e.target.value })} className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500" placeholder="e.g. INV-4582" /></div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Purchased From Pharmacy</label>
              <div className="relative"><Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /><select required value={state.pharmacy} onChange={(e) => setState({ ...state, pharmacy: e.target.value })} className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"><option value="">Select pharmacy...</option>{pharmacyOptions.map((pharmacy) => <option key={pharmacy} value={pharmacy}>{pharmacy}</option>)}</select></div>
              {pharmacyOptions.length === 0 && <p className="mt-1 text-xs text-rose-500 font-semibold">Add pharmacies from Settings → Short Items Staff.</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shadow-md">{submitting ? 'Saving...' : 'Confirm Purchase & Return'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
