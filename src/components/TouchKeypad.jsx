import React from 'react';
import { Delete, X } from 'lucide-react';

export default function TouchKeypad({ onDigit, onDelete, onClear, onClose }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Touch Keypad</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="h-12 text-lg font-bold bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 hover:text-emerald-700 text-slate-700 rounded-xl border border-slate-200 transition-all flex items-center justify-center select-none shadow-sm active:scale-95"
          >
            {k}
          </button>
        ))}

        <button
          type="button"
          onClick={onDelete}
          className="h-12 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl border border-amber-200 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          title="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onClear}
          className="col-span-2 h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm uppercase tracking-wider rounded-xl border border-rose-200 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          Clear (C)
        </button>
      </div>
    </div>
  );
}
