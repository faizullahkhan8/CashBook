import React, { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';

const DENOMINATIONS = [5000, 1000, 500, 100, 50, 20, 10];

export default function EditClosingModal({ closing, currency, saving, onClose, onSave }) {
  const [form, setForm] = useState({ employee_1: '', employee_2: '', counted_cash: '', audit_notes: '' });
  const [denominations, setDenominations] = useState({});

  useEffect(() => {
    if (!closing) return;
    let parsed = {};
    try {
      parsed = typeof closing.denominations_json === 'string'
        ? JSON.parse(closing.denominations_json)
        : closing.denominations_json || {};
    } catch { parsed = {}; }
    setDenominations(parsed);
    setForm({
      employee_1: closing.employee_1 || '',
      employee_2: closing.employee_2 || '',
      counted_cash: String(closing.counted_cash ?? ''),
      audit_notes: closing.audit_notes || '',
    });
  }, [closing]);

  if (!closing) return null;

  const changeDenomination = (key, value) => {
    const next = { ...denominations, [key]: Math.max(0, parseInt(value, 10) || 0) };
    const notesTotal = DENOMINATIONS.reduce((sum, denomination) => sum + (Number(next[String(denomination)]) || 0) * denomination, 0);
    const total = notesTotal + (Number(next.coins) || 0);
    setDenominations(next);
    setForm((current) => ({ ...current, counted_cash: String(total) }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, denominations_json: denominations });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-[#27325b] px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Pencil className="w-5 h-5 text-emerald-400" /> Edit {closing.closing_code}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-medium text-blue-800">
            Sales, short-items deduction and expected cash will be recalculated automatically from this closing’s linked shift.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['employee_1', 'employee_2'].map((field, index) => (
              <div key={field}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Employee {index + 1}</label>
                <input required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cash Denominations</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DENOMINATIONS.map((value) => (
                <label key={value} className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {currency} {value.toLocaleString()}
                  <input type="number" min="0" step="1" value={denominations[String(value)] || ''} onChange={(e) => changeDenomination(String(value), e.target.value)} className="mt-1 w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-bold focus:outline-none focus:border-emerald-500" />
                </label>
              ))}
              <label className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Coins total
                <input type="number" min="0" step="0.01" value={denominations.coins || ''} onChange={(e) => changeDenomination('coins', e.target.value)} className="mt-1 w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-bold focus:outline-none focus:border-emerald-500" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Counted Cash ({currency})</label>
            <input type="number" required min="0" step="0.01" value={form.counted_cash} onChange={(e) => setForm({ ...form, counted_cash: e.target.value })} className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xl font-black font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Audit Notes</label>
            <textarea rows="3" value={form.audit_notes} onChange={(e) => setForm({ ...form, audit_notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Recalculate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
