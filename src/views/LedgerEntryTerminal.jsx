import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Banknote,
  CreditCard,
  Plus,
  Trash2,
  Keyboard,
  Receipt,
  User,
  Monitor,
  ArrowRight,
  Calculator,
  FileText
} from 'lucide-react';

export default function LedgerEntryTerminal({ onSwitchToArchive }) {
  const {
    activeShift,
    summary,
    recentEntries,
    nextInvoice,
    addLedgerEntry,
    deleteLedgerEntry,
    setCurrentView,
    settings,
  } = useApp();

  const [amountStr, setAmountStr] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (nextInvoice) setInvoiceNumber(nextInvoice);
  }, [nextInvoice]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        const num = parseFloat(amountStr);
        if (!num || num <= 0) {
          inputRef.current?.focus();
          return;
        }
        if (e.shiftKey) {
          handleSubmitPayment('ONLINE');
        } else {
          handleSubmitPayment('CASH');
        }
      } else if (e.key === 'Escape') {
        setAmountStr('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [amountStr, invoiceNumber, notes, activeShift]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) setAmountStr(val);
  };

  const handleQuickAdd = (addVal) => {
    const current = parseFloat(amountStr) || 0;
    const next = (current + addVal).toFixed(2);
    setAmountStr(next.endsWith('.00') ? String(parseInt(next, 10)) : next);
    inputRef.current?.focus();
  };

  const handleClearAmount = () => {
    setAmountStr('');
    inputRef.current?.focus();
  };

  const handleSubmitPayment = async (payment_method) => {
    const num = parseFloat(amountStr);
    if (!num || num <= 0) {
      inputRef.current?.focus();
      return;
    }

    const success = await addLedgerEntry({
      invoice_number: invoiceNumber.trim() || nextInvoice,
      customer_type: 'Walk-in Customer',
      amount: num,
      payment_method,
      notes: notes.trim(),
      shift_type: activeShift?.shift_type || 'Day',
      employee_1: activeShift?.employee_1 || '',
      employee_2: activeShift?.employee_2 || '',
    });

    if (success) {
      setAmountStr('');
      setNotes('');
      inputRef.current?.focus();
    }
  };

  const handleDeleteEntry = async (entry) => {
    const shouldDelete = window.confirm(
      `Delete receipt ${entry.invoice_number} for ${settings.currency} ${entry.amount}?`
    );

    if (shouldDelete) {
      await deleteLedgerEntry(entry.id);
    }

    // The native confirmation dialog moves focus away from the payment field.
    // Restore it after the dialog closes and any ledger state update finishes.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Column */}
      <div className="flex-1 flex flex-col space-y-5 min-w-0">

        {/* Payment Terminal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              <span>Counter Payment Terminal</span>
            </h3>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex-1 sm:flex-none">
                <Receipt className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Invoice #"
                  className="w-full sm:w-32 bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-2 rounded-lg uppercase tracking-wider hidden sm:block">
                {settings.currency}
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-50 border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all p-2 py-4 flex items-center justify-center shadow-inner">
            <div className="flex items-baseline space-x-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-300 select-none font-mono">
                {settings.currency}
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={handleAmountChange}
                className="bg-transparent text-6xl sm:text-7xl font-black text-slate-800 focus:outline-none w-64 sm:w-80 text-center tracking-tighter font-mono placeholder:text-slate-200"
              />
            </div>

            {amountStr && (
              <button
                type="button"
                onClick={handleClearAmount}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors"
              >
                Clear (Esc)
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 select-none flex-shrink-0">
              Quick Add:
            </span>
            {[50, 100, 200, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAdd(val)}
                className="flex-1 min-w-[60px] py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 transition-colors shadow-xs active:scale-95 text-center select-none"
              >
                +{val.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
                <span>Notes / Memo (Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional customer/item notes..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Large Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleSubmitPayment('CASH')}
              className="group relative h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] text-white shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-between px-6 border-b-4 border-emerald-800"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black tracking-tight">CASH</div>
                  <div className="text-xs text-emerald-100/90 font-medium">Drawer Payment</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-black/20 text-[11px] font-mono font-bold tracking-wider uppercase border border-white/10">
                <span>Enter</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitPayment('ONLINE')}
              className="group relative h-20 rounded-2xl bg-gradient-to-br from-[#27325b] to-[#1d2646] hover:from-[#1f2849] hover:to-[#171e37] active:scale-[0.98] text-white shadow-xl shadow-[#27325b]/20 transition-all flex items-center justify-between px-6 border-b-4 border-[#12182c]"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black tracking-tight">ONLINE</div>
                  <div className="text-xs text-blue-200/90 font-medium">Card / Bank / QR</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-black/20 text-[11px] font-mono font-bold tracking-wider uppercase border border-white/10">
                <span>Shift+Enter</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Shift Feed */}
      <div className="w-full xl:w-[450px] flex flex-col space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Live Shift Feed <span className="text-slate-400 font-medium">({recentEntries.length})</span>
            </h3>
          </div>
          <div className="flex space-x-3 text-[11px] font-bold">
            <span className="text-emerald-600 uppercase tracking-wider">{summary.cashCount} Cash</span>
            <span className="text-indigo-600 uppercase tracking-wider">{summary.onlineCount} Online</span>
          </div>
        </div>

        {/* Transaction Feed Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-[500px]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Receipt Log
            </span>
            {/* {onSwitchToArchive && (
              <button
                type="button"
                onClick={onSwitchToArchive}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                View Master Ledger &rarr;
              </button>
            )} */}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recentEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                  <Receipt className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-600">No transactions recorded yet</p>
                  <p className="text-xs text-slate-400 mt-1">Punch an amount to start current shift</p>
                </div>
              </div>
            ) : (
              recentEntries.map((entry) => {
                const isCash = entry.payment_method === 'CASH';
                const timeStr = formatDate(entry.timestamp);

                return (
                  <div
                    key={entry.id}
                    className="group relative p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-between overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCash ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>

                    <div className="min-w-0 flex-1 pl-2 pr-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-bold text-xs text-slate-500">
                          {entry.invoice_number}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isCash ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                          {entry.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-1 truncate">
                        {entry.notes && <span>{entry.notes}</span>}
                        {entry.notes && <span className="text-slate-300">•</span>}
                        <span>{timeStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="font-mono text-base font-black text-slate-900 whitespace-nowrap">
                        {settings.currency} {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete receipt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
