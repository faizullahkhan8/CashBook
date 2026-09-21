import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  Save,
  ArrowLeftRight,
  User,
  Calculator,
  Plus
} from 'lucide-react';

export default function ShortItemsView() {
  const {
    activeShift,
    settings,
    shortItems,
    refreshShortItems,
    showToast,
    setCurrentView,
  } = useApp();

  const shortItemStaffList = useMemo(() => {
    const raw = settings?.short_items_staff;
    if (!raw) return ['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      const list = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) return list;
    }
    return ['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'];
  }, [settings?.short_items_staff]);

  const [amountStr, setAmountStr] = useState('');
  const [givenTo, setGivenTo] = useState('');
  const [notes, setNotes] = useState('');
  const inputRef = useRef(null);

  const [returnModal, setReturnModal] = useState({ open: false, item: null, returnedAmount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (shortItemStaffList.length > 0) {
      if (!givenTo || !shortItemStaffList.includes(givenTo)) {
        setGivenTo(shortItemStaffList[0]);
      }
    } else {
      setGivenTo('');
    }
  }, [shortItemStaffList]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) setAmountStr(val);
  };

  const handleClearAmount = () => {
    setAmountStr('');
    inputRef.current?.focus();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amountStr);
    if (!num || num <= 0 || !givenTo) {
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.addShortItem({
        amount: num,
        given_to: givenTo,
        notes: notes.trim()
      });
      if (res) {
        showToast('Short item recorded successfully', 'success');
        setAmountStr('');
        setNotes('');
        await refreshShortItems();
        inputRef.current?.focus();
      }
    } catch (err) {
      showToast(err.message || 'Error adding short item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModal.item) return;

    setIsSubmitting(true);
    try {
      const res = await api.returnShortItem(returnModal.item.id, {
        returned_amount: returnModal.returnedAmount
      });
      if (res) {
        showToast('Short item returned successfully', 'success');
        setReturnModal({ open: false, item: null, returnedAmount: '' });
        await refreshShortItems();
      }
    } catch (err) {
      showToast(err.message || 'Error returning short item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    return new Date(ds).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col xl:flex-row gap-6">
      {/* Left Column */}
      <div className="flex-1 flex flex-col space-y-5 min-w-0">

        {/* Terminal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              <span>Issue Cash for Short Item</span>
            </h3>
          </div>

          <div className="relative rounded-2xl bg-slate-50 border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all p-6 py-8 flex items-center justify-center shadow-inner">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubmit(e);
                  } else if (e.key === 'Escape') {
                    handleClearAmount();
                  }
                }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Given To (Short Item Staff)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentView('settings')}
                  className="text-[10px] font-black text-[#27325b] hover:text-indigo-600 hover:underline flex items-center space-x-1"
                  title="Configure short item staff roster in Settings"
                >
                  <span>+ Manage Staff</span>
                </button>
              </div>
              <select
                value={givenTo}
                onChange={(e) => setGivenTo(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-sm"
              >
                {shortItemStaffList.map((staff, idx) => (
                  <option key={idx} value={staff}>{staff}</option>
                ))}
                {shortItemStaffList.length === 0 && (
                  <option value="">-- No Staff Set (Add in Settings) --</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
                <span>Notes / Description</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubmit(e);
                  }
                }}
                placeholder="Medicine name etc..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddSubmit}
              className="w-full group relative h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] text-white shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center px-6 border-b-4 border-emerald-800 disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-emerald-100 group-hover:scale-110 transition-transform drop-shadow-md" />
                <div className="text-xl font-black tracking-tight drop-shadow-sm">Issue Cash (Press Enter)</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full xl:w-[450px] flex flex-col space-y-5">

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Live Feed <span className="text-slate-400 font-medium">({shortItems.length})</span>
            </h3>
          </div>
          <div className="flex space-x-3 text-[11px] font-bold">
            <span className="text-rose-600 uppercase tracking-wider">{shortItems.filter(i => i.status === 'PENDING').length} Pending</span>
            <span className="text-emerald-600 uppercase tracking-wider">{shortItems.filter(i => i.status === 'RETURNED').length} Returned</span>
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden h-[500px]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Short Items Log
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {shortItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-600">No short items yet</p>
                  <p className="text-xs text-slate-400 mt-1">Issue cash to record items</p>
                </div>
              </div>
            ) : (
              shortItems.map((item) => {
                const isPending = item.status === 'PENDING';
                const timeStr = formatDate(item.created_at);

                return (
                  <div
                    key={item.id}
                    className="group relative p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-between overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                    <div className="min-w-0 flex-1 pl-2 pr-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-sm text-slate-800">
                          {item.given_to}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isPending ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-1 truncate">
                        {item.notes && <span>{item.notes}</span>}
                        {item.notes && <span className="text-slate-300">•</span>}
                        <span>{timeStr}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {settings.currency} {Number(item.amount).toLocaleString()}
                      </span>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => setReturnModal({ open: true, item, returnedAmount: '' })}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Return</span>
                        </button>
                      ) : (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Spent: {settings.currency} {Number(item.spent_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {returnModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in-bottom">
            <div className="bg-[#27325b] px-6 py-5 border-b border-[#27325b] flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                <span>Return Short Item Cash</span>
              </h3>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6">
              <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Given To:</span>
                  <span className="font-bold text-slate-800">{returnModal.item.given_to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Given:</span>
                  <span className="font-bold text-rose-600">{settings.currency} {Number(returnModal.item.amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount Returned ({settings.currency})</label>
                <input
                  type="number"
                  required
                  min="0"
                  max={returnModal.item.amount}
                  step="0.01"
                  value={returnModal.returnedAmount}
                  onChange={(e) => setReturnModal({ ...returnModal, returnedAmount: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-4 font-bold text-lg text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                  placeholder="0.00"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Spent amount will be calculated as: Given - Returned
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setReturnModal({ open: false, item: null, returnedAmount: '' })}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
