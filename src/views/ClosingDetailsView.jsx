import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import {
  ArrowLeft, Archive, Banknote, CreditCard, Receipt, ShoppingCart,
  Scale, WalletCards, AlertTriangle, CheckCircle2, User, Clock, Printer
} from 'lucide-react';

export default function ClosingDetailsView() {
  const { selectedClosingForDetails: closing, settings, setCurrentView, openSlip } = useApp();
  const [ledgers, setLedgers] = useState([]);
  const [shortItems, setShortItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!closing?.shift_id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      api.getAllLedgerEntries({ shiftId: closing.shift_id }),
      api.getShortItems(closing.shift_id),
    ]).then(([ledgerRows, shortRows]) => {
      if (!active) return;
      setLedgers(Array.isArray(ledgerRows) ? ledgerRows : []);
      setShortItems(Array.isArray(shortRows) ? shortRows : []);
    }).catch(() => {
      if (!active) return;
      setLedgers([]);
      setShortItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [closing?.shift_id]);

  const stats = useMemo(() => {
    if (!closing) return [];
    const opening = Number(closing.opening_float || 0);
    const cash = Number(closing.cash_sales || 0);
    const online = Number(closing.online_sales || 0);
    const expected = Number(closing.expected_drawer_cash || 0);
    const counted = Number(closing.counted_cash || 0);
    const variance = Number(closing.variance || 0);
    const shortItemsTotal = opening + cash - expected;
    return [
      { label: 'Opening Float', value: opening, icon: WalletCards, color: 'slate' },
      { label: 'Cash Sales', value: cash, icon: Banknote, color: 'emerald' },
      { label: 'Online Sales', value: online, icon: CreditCard, color: 'indigo' },
      { label: 'Total Revenue', value: Number(closing.total_revenue || 0), icon: Receipt, color: 'blue' },
      { label: 'Short Items', value: shortItemsTotal, icon: ShoppingCart, color: 'rose', prefix: '-' },
      { label: 'Expected Drawer', value: expected, icon: Scale, color: 'teal' },
      { label: 'Counted Cash', value: counted, icon: CheckCircle2, color: 'emerald' },
      { label: 'Variance', value: variance, icon: AlertTriangle, color: Math.abs(variance) < 0.01 ? 'emerald' : 'amber', signed: true },
    ];
  }, [closing]);

  const colors = {
    slate: 'border-l-slate-400 text-slate-800 dark:text-slate-100',
    emerald: 'border-l-emerald-500 text-emerald-700 dark:text-emerald-400',
    indigo: 'border-l-indigo-500 text-indigo-700 dark:text-indigo-400',
    blue: 'border-l-blue-500 text-blue-700 dark:text-blue-400',
    rose: 'border-l-rose-500 text-rose-700 dark:text-rose-400',
    teal: 'border-l-teal-500 text-teal-700 dark:text-teal-400',
    amber: 'border-l-amber-500 text-amber-700 dark:text-amber-400',
  };

  const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateTime = (value) => value ? new Date(value).toLocaleString() : '—';

  if (!closing) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Archive className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-bold text-slate-600 dark:text-slate-300">No closing selected.</p>
          <button onClick={() => setCurrentView('all-closings')} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">Back to Closings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#090d16]">
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setCurrentView('all-closings')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" title="Back to all closings">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{closing.closing_code}</h2>
                {Number(closing.is_void) === 1 && <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black tracking-wider">VOID</span>}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dateTime(closing.closed_at)} · {closing.shift_type || 'Day'} Shift</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span>{closing.employee_1 || 'Staff'} & {closing.employee_2 || 'Staff'}</span>
            </div>
            <button type="button" onClick={() => openSlip(closing)} className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95">
              <Printer className="w-4 h-4" />
              <span>Print Closing</span>
            </button>
          </div>
        </div>

        {Number(closing.is_void) === 1 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 font-semibold">
            This closing is VOID. Reason: {closing.void_reason || 'Not provided'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const sign = stat.signed && stat.value > 0 ? '+' : stat.prefix || '';
            return (
              <div key={stat.label} className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border-y border-r border-slate-200 dark:border-slate-800 border-l-4 shadow-sm ${colors[stat.color]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-3 text-xl 2xl:text-2xl font-black font-mono whitespace-nowrap">{sign} {settings.currency} {money(stat.value)}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-500" /> Shift Ledgers</h3>
              <span className="text-xs font-bold text-slate-500">{ledgers.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr><th className="text-left p-4">Invoice / Time</th><th className="text-left p-4">Notes</th><th className="text-center p-4">Method</th><th className="text-right p-4">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? <tr><td colSpan="4" className="p-10 text-center text-slate-400">Loading entries...</td></tr> : ledgers.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-slate-400">No ledgers recorded for this shift.</td></tr> : ledgers.map((entry) => (
                    <tr key={entry.id} className="text-slate-700 dark:text-slate-200">
                      <td className="p-4"><div className="font-mono font-bold">{entry.invoice_number}</div><div className="text-[11px] text-slate-400 mt-1">{dateTime(entry.created_at)}</div></td>
                      <td className="p-4 text-xs">{entry.notes || '—'}</td>
                      <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-[10px] font-black ${entry.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{entry.payment_method}</span></td>
                      <td className="p-4 text-right font-mono font-black whitespace-nowrap">{settings.currency} {money(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-rose-500" /> Short Items</h3>
              <span className="text-xs font-bold text-slate-500">{shortItems.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[620px] overflow-y-auto custom-scrollbar">
              {loading ? <div className="py-10 text-center text-slate-400">Loading...</div> : shortItems.length === 0 ? <div className="py-10 text-center text-slate-400">No short items for this shift.</div> : shortItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.given_to}</div><div className="text-xs text-slate-500 mt-1 truncate">{item.notes || 'No notes'}</div>{item.status === 'RETURNED' && <div className="text-[10px] text-slate-400 mt-1 truncate">{item.pharmacy || 'Pharmacy'} · Ref: {item.reference_no || '—'}</div>}</div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md ${item.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.status}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {dateTime(item.created_at)}</div>
                    <div className="text-right"><div className="font-mono font-black text-sm text-slate-800 dark:text-slate-100">{settings.currency} {money(item.amount)}</div>{item.status === 'RETURNED' && <div className="text-[10px] font-bold text-rose-500">Spent {settings.currency} {money(item.spent_amount)}</div>}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
