import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmationModal({ dialog, onRespond }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(dialog?.inputDefault || '');
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onRespond(false, '');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, onRespond]);

  if (!dialog) return null;

  const isDanger = dialog.variant !== 'warning';
  const inputRequired = Boolean(dialog.requireInput);
  const canConfirm = !inputRequired || inputValue.trim().length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (canConfirm) onRespond(true, inputValue.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <form onSubmit={submit} className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        <div className={`px-6 py-5 flex items-start justify-between gap-4 ${isDanger ? 'bg-rose-50 dark:bg-rose-950/35' : 'bg-amber-50 dark:bg-amber-950/35'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
              {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="confirmation-modal-title" className="text-lg font-black text-slate-900 dark:text-white">{dialog.title || 'Confirm action'}</h3>
              {dialog.message && <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{dialog.message}</p>}
            </div>
          </div>
          <button type="button" onClick={() => onRespond(false, '')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800" aria-label="Close confirmation">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {dialog.details && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              {dialog.details}
            </div>
          )}

          {inputRequired && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{dialog.inputLabel || 'Reason'}</label>
              <textarea
                rows={3}
                required
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.inputPlaceholder || 'Enter a reason...'}
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => onRespond(false, '')} className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors">
              {dialog.cancelText || 'Cancel'}
            </button>
            <button type="submit" disabled={!canConfirm} autoFocus={!inputRequired} className={`flex-1 h-11 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}>
              {dialog.confirmText || (isDanger ? 'Delete' : 'Confirm')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
