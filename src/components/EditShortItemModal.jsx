import React, { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';

export default function EditShortItemModal({ item, currency, staffOptions = [], saving, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [givenTo, setGivenTo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!item) return;
    setAmount(String(item.amount ?? ''));
    setGivenTo(item.given_to || '');
    setNotes(item.notes || '');
  }, [item]);

  if (!item) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave({ amount, given_to: givenTo, notes });
  };

  const options = givenTo && !staffOptions.includes(givenTo)
    ? [givenTo, ...staffOptions]
    : staffOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-up">
        <div className="bg-[#27325b] px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Pencil className="w-5 h-5 text-emerald-400" />
            <span>Edit Short Item</span>
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Issued Amount ({currency})
            </label>
            <input
              type="number"
              required
              min={item.status === 'RETURNED' ? Number(item.bill_amount || item.spent_amount) || 0.01 : 0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-lg font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            {item.status === 'RETURNED' && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Amount cannot be below the purchase bill ({currency} {Number(item.bill_amount || item.spent_amount || 0).toLocaleString()}).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Given To</label>
            {options.length > 0 ? (
              <select
                required
                value={givenTo}
                onChange={(e) => setGivenTo(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {options.map((staff) => <option key={staff} value={staff}>{staff}</option>)}
              </select>
            ) : (
              <input
                type="text"
                required
                value={givenTo}
                onChange={(e) => setGivenTo(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Notes / Description</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
