import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import EditShortItemModal from '../components/EditShortItemModal';
import ReturnShortItemModal from '../components/ReturnShortItemModal';
import {
  ShoppingCart,
  Search,
  ArrowLeftRight,
  User,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  RotateCcw,
  Receipt,
  Download,
  Pencil,
  Trash2
} from 'lucide-react';

export default function AllShortItemsList({ onSwitchToTerminal }) {
  const {
    settings,
    refreshShortItems,
    showToast,
    activeShift,
  } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'RETURNED'
  const [shiftFilter, setShiftFilter] = useState('ALL');   // 'ALL' | 'Day' | 'Night'

  const emptyReturnModal = { open: false, item: null, billAmount: '', referenceNo: '', pharmacy: '' };
  const [returnModal, setReturnModal] = useState(emptyReturnModal);
  const [editItem, setEditItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shortItemStaffList = useMemo(() => {
    const raw = settings?.short_items_staff;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return String(raw).split(',').map((staff) => staff.trim()).filter(Boolean);
    }
  }, [settings?.short_items_staff]);

  const pharmacyList = useMemo(() => {
    const raw = settings?.short_item_pharmacies;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return String(raw).split(',').map((value) => value.trim()).filter(Boolean);
    }
  }, [settings?.short_item_pharmacies]);

  const loadAllItems = async () => {
    setLoading(true);
    try {
      const data = await api.getShortItems('ALL');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch all short items:', err);
      showToast('Error loading short items history: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllItems();
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModal.item) return;

    setIsSubmitting(true);
    try {
      const res = await api.returnShortItem(returnModal.item.id, {
        bill_amount: returnModal.billAmount,
        reference_no: returnModal.referenceNo,
        pharmacy: returnModal.pharmacy,
      });
      if (res) {
        showToast('Short item returned successfully', 'success');
        setReturnModal(emptyReturnModal);
        await loadAllItems();
        await refreshShortItems();
      }
    } catch (err) {
      showToast(err.message || 'Error returning short item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data) => {
    if (!editItem) return;
    setIsSubmitting(true);
    try {
      await api.updateShortItem(editItem.id, data);
      showToast('Short item updated successfully', 'success');
      setEditItem(null);
      await loadAllItems();
      await refreshShortItems();
    } catch (err) {
      showToast(err.message || 'Error updating short item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete short item #${String(item.id).padStart(4, '0')} permanently?`)) return;
    try {
      await api.deleteShortItem(item.id);
      showToast('Short item deleted successfully', 'info');
      await loadAllItems();
      await refreshShortItems();
    } catch (err) {
      showToast(err.message || 'Error deleting short item', 'error');
    }
  };

  // Metrics
  const totalCount = items.length;
  const pendingCount = items.filter(i => i.status === 'PENDING').length;
  const returnedCount = items.filter(i => i.status === 'RETURNED').length;

  const totalIssued = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalReturned = items.reduce((sum, i) => sum + (Number(i.returned_amount) || 0), 0);
  const totalSpent = items.reduce((sum, i) => sum + (Number(i.spent_amount) || 0), 0);

  // Filtered Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        (item.given_to && item.given_to.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        String(item.id).includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      const matchesShift =
        shiftFilter === 'ALL' || (item.shift_type && item.shift_type === shiftFilter);

      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [items, searchQuery, statusFilter, shiftFilter]);

  const formatDate = (ds) => {
    if (!ds) return '—';
    const d = new Date(ds);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Short Items Master History
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Complete archive of petty cash disbursements and returns for short medicines
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadAllItems}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-xs"
            title="Reload short items data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onSwitchToTerminal && (
            <button
              type="button"
              onClick={onSwitchToTerminal}
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Short Cash</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-slate-400 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Total Short Records
          </span>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono my-2">
            {totalCount}
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="text-rose-600 dark:text-rose-400">{pendingCount} Pending</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 dark:text-emerald-400">{returnedCount} Returned</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
            Total Cash Issued
          </span>
          <div className="text-2xl lg:text-3xl font-black text-indigo-700 dark:text-indigo-300 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalIssued.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Given to purchasing staff</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Total Cash Returned
          </span>
          <div className="text-2xl lg:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalReturned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Returned back to till</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">
            Net Cash Spent
          </span>
          <div className="text-2xl lg:text-3xl font-black text-rose-700 dark:text-rose-300 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Utilized for medicine purchase</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/40">
          <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Short Items List ({filteredItems.length})</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, notes, or ID..."
                className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm font-medium transition-all"
              />
            </div>

            {/* Shift Filter Pills */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setShiftFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  shiftFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                All Shifts
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('Day')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  shiftFilter === 'Day'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('Night')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  shiftFilter === 'Night'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night</span>
              </button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold shadow-inner">
              {['ALL', 'PENDING', 'RETURNED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st === 'PENDING' ? 'Pending' : 'Returned'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th className="py-3 px-5">ID & Timestamp</th>
                <th className="py-3 px-5">Given To Staff</th>
                <th className="py-3 px-5">Shift</th>
                <th className="py-3 px-5">Notes / Memo</th>
                <th className="py-3 px-5 text-right">Cash Issued</th>
                <th className="py-3 px-5 text-right">Cash Returned</th>
                <th className="py-3 px-5 text-right">Net Spent</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20 mx-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 animate-fade-in space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                        <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                          No matching short items found
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try clearing search filters or issue a new short item.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isNight = item.shift_type === 'Night';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          #{String(item.id).padStart(4, '0')}
                        </span>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {formatDate(item.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-sans">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.given_to || 'Staff'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-sans">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isNight
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          <span>{isNight ? '🌙' : '☀️'}</span>
                          <span>{item.shift_type || 'Day'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-sans max-w-[200px]">
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate block" title={item.notes || 'No description'}>
                          {item.notes || '—'}
                        </span>
                        {item.status === 'RETURNED' && (item.pharmacy || item.reference_no) && (
                          <span className="text-[10px] text-slate-400 block mt-1 truncate" title={`${item.pharmacy || ''} ${item.reference_no || ''}`}>
                            {item.pharmacy || 'Pharmacy'} · Ref: {item.reference_no || '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {settings.currency} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {item.returned_amount !== null && item.returned_amount !== undefined ? (
                          `${settings.currency} ${Number(item.returned_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {item.spent_amount !== null && item.spent_amount !== undefined ? (
                          `${settings.currency} ${Number(item.spent_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-center font-sans">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isPending
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          <span>{item.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setReturnModal({ ...emptyReturnModal, open: true, item, pharmacy: pharmacyList[0] || '' })}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1 mx-auto shadow-sm active:scale-95"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        )}
                          <button type="button" onClick={() => setEditItem(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" title="Edit short item">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(item)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50" title="Delete short item">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal Dialog */}
      {false && returnModal.open && returnModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="bg-[#27325b] px-6 py-5 border-b border-[#27325b] flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                <span>Return Short Item Cash</span>
              </h3>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Given To:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{returnModal.item.given_to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Amount Given:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {settings.currency} {Number(returnModal.item.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Amount Returned ({settings.currency})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={returnModal.item.amount}
                  step="0.01"
                  value={returnModal.returnedAmount}
                  onChange={(e) => setReturnModal({ ...returnModal, returnedAmount: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 font-bold text-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                  placeholder="0.00"
                  autoFocus
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Spent amount will be calculated as: Given - Returned
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setReturnModal({ open: false, item: null, returnedAmount: '' })}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReturnShortItemModal
        state={returnModal}
        setState={setReturnModal}
        currency={settings.currency}
        pharmacyOptions={pharmacyList}
        submitting={isSubmitting}
        onClose={() => setReturnModal(emptyReturnModal)}
        onSubmit={handleReturnSubmit}
      />

      <EditShortItemModal
        item={editItem}
        currency={settings.currency}
        staffOptions={shortItemStaffList}
        saving={isSubmitting}
        onClose={() => setEditItem(null)}
        onSave={handleEditSubmit}
      />
    </div>
  );
}
