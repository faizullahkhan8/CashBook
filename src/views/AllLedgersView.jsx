import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Banknote, 
  CreditCard, 
  Receipt,
  RotateCcw,
  Sun,
  Moon,
  Edit
} from 'lucide-react';
import { api } from '../api';
import ReceiptModal from '../components/ReceiptModal';
import EditLedgerModal from '../components/EditLedgerModal';

export default function AllLedgersView({ onSwitchToEntry }) {
  const { settings, deleteLedgerEntry, recentEntries, setCurrentView } = useApp();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [viewReceipt, setViewReceipt] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL'); 
  const [methodFilter, setMethodFilter] = useState('ALL'); 
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (shiftFilter !== 'ALL') filters.shiftType = shiftFilter;
      if (methodFilter !== 'ALL') filters.method = methodFilter;
      if (customerFilter !== 'ALL') filters.customerType = customerFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const now = new Date();
      if (dateFilter === 'TODAY') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        filters.startDate = todayStart;
      } else if (dateFilter === 'YESTERDAY') {
        const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        filters.startDate = yStart;
        filters.endDate = yEnd;
      } else if (dateFilter === 'WEEK') {
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        filters.startDate = weekStart;
      } else if (dateFilter === 'MONTH') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        filters.startDate = monthStart;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) filters.startDate = customStartDate.replace('T', ' ') + ':00';
        if (customEndDate) filters.endDate = customEndDate.replace('T', ' ') + ':59';
      }

      const results = await api.getAllLedgerEntries(filters);
      const sorted = (results || []).sort((a, b) => (b.id || 0) - (a.id || 0));
      setLedgers(sorted);
    } catch (err) {
      console.error('Failed to load ledgers:', err);
    } finally {
      setLoading(false);
    }
  }, [shiftFilter, methodFilter, customerFilter, searchQuery, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    loadLedgers();
  }, [loadLedgers, recentEntries]);

  const totalEntries = ledgers.length;
  const totalCash = ledgers.filter((l) => l.payment_method === 'CASH').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalOnline = ledgers.filter((l) => l.payment_method === 'ONLINE').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalRevenue = totalCash + totalOnline;

  const handleDelete = async (id, inv) => {
    if (window.confirm(`Are you sure you want to void / delete ledger entry ${inv}?`)) {
      await deleteLedgerEntry(id);
      loadLedgers();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setShiftFilter('ALL');
    setMethodFilter('ALL');
    setCustomerFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Invoice #', 'Date & Time', 'Shift', 'Employee 1', 'Employee 2', 'Payment Method', 'Customer Type', 'Amount', 'Station', 'Notes'];
    const rows = ledgers.map((l) => [
      l.id, l.invoice_number, l.created_at, l.shift_type || 'Day',
      `"${(l.employee_1 || '').replace(/"/g, '""')}"`, `"${(l.employee_2 || '').replace(/"/g, '""')}"`,
      l.payment_method, l.customer_type, l.amount, l.register_station || 'Register 01', `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Zada_Pharmacy_Ledgers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => api.printSlip();

  const hasActiveFilters = searchQuery || shiftFilter !== 'ALL' || methodFilter !== 'ALL' || customerFilter !== 'ALL' || dateFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Master Ledger Records</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Filterable database of all historical transactions</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (onSwitchToEntry) onSwitchToEntry();
              else setCurrentView('ledger');
            }}
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
          >
            <span>+ New Entry</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center justify-center space-x-2 border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recorded Transactions</span>
          <div className="text-3xl font-black text-slate-800 font-mono my-2">{totalEntries}</div>
          <span className="text-xs font-semibold text-slate-400">Filtered receipts</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Cash Intake</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-800 font-mono my-2 truncate">
            {settings.currency} {totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Physical drawer cash</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Online Intake</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-800 font-mono my-2 truncate">
            {settings.currency} {totalOnline.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Digital / Bank transfers</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Revenue</span>
          <div className="text-3xl font-black text-slate-900 font-mono my-2 truncate">
            {settings.currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Aggregated payments</span>
        </div>
      </div>

      {/* Filter Toolbar (Stable Layout) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="relative w-full lg:w-72 flex-shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice or staff..."
              className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700 transition-all shadow-inner"
            />
          </div>

          {/* Grouped Filters that don't shift */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold shadow-inner">
              <button onClick={() => setShiftFilter('ALL')} className={`px-4 py-1.5 rounded-lg transition-all ${shiftFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Shifts</button>
              <button onClick={() => setShiftFilter('Day')} className={`px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${shiftFilter === 'Day' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Sun className="w-3.5 h-3.5" /><span>Day</span></button>
              <button onClick={() => setShiftFilter('Night')} className={`px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${shiftFilter === 'Night' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Moon className="w-3.5 h-3.5" /><span>Night</span></button>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold shadow-inner">
              {['ALL', 'CASH', 'ONLINE'].map((m) => (
                <button key={m} onClick={() => setMethodFilter(m)} className={`px-4 py-1.5 rounded-lg transition-all ${methodFilter === m ? (m === 'CASH' ? 'bg-white text-emerald-700 shadow-sm' : m === 'ONLINE' ? 'bg-white text-indigo-700 shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}>
                  {m === 'ALL' ? 'All Methods' : m}
                </button>
              ))}
            </div>

            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="h-11 px-3 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:border-emerald-500 shadow-sm cursor-pointer">
              <option value="ALL">All Customers</option>
              <option value="Walk-in Customer">Walk-in Customer</option>
              <option value="Regular Patient">Regular Patient</option>
              <option value="Prescription Delivery">Prescription Delivery</option>
              <option value="Hospital Staff">Hospital Staff</option>
              <option value="Emergency Care">Emergency Care</option>
            </select>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-11 px-3 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:border-emerald-500 shadow-sm cursor-pointer">
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="CUSTOM">Custom Range</option>
            </select>

            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                <input 
                  type="datetime-local" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-9 px-2 text-[11px] rounded-lg border-none bg-white font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold text-[10px] uppercase">to</span>
                <input 
                  type="datetime-local" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-9 px-2 text-[11px] rounded-lg border-none bg-white font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Stable Reset Button Container */}
            <div className="w-24 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className={`h-11 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all w-full border ${
                  hasActiveFilters 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 shadow-sm cursor-pointer opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="font-black text-sm text-slate-800">
              Transaction Records ({ledgers.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider">Sorted: Newest First</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur z-10">
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-3 px-5">Invoice #</th>
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Shift</th>
                <th className="py-3 px-5">Staff (Both)</th>
                <th className="py-3 px-5 text-center">Payment</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5">Remarks</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse even:bg-slate-50/40">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 mx-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="py-4 px-5"><div className="h-6 w-6 bg-slate-200 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : ledgers.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 animate-fade-in space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-slate-700">No records found</p>
                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term</p>
                      </div>
                      {hasActiveFilters && (
                        <button onClick={handleResetFilters} className="mt-2 text-emerald-600 font-bold text-sm hover:underline">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                ledgers.map((l) => {
                  const isCash = l.payment_method === 'CASH';
                  const isNight = l.shift_type === 'Night';
                  const dateStr = l.created_at ? new Date(l.created_at).toLocaleDateString() : '';
                  const timeStr = l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  const staffDisplay = l.employee_1 && l.employee_2 ? `${l.employee_1} & ${l.employee_2}` : l.employee_1 || l.employee_2 || '—';

                  return (
                    <tr key={l.id} className="hover:bg-emerald-50/40 even:bg-slate-50/40 transition-colors group">
                      <td className="py-3 px-5 font-bold text-slate-900">{l.invoice_number}</td>
                      <td className="py-3 px-5 text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-600">{dateStr}</div>
                        <div className="text-[10px]">{timeStr}</div>
                      </td>
                      <td className="py-3 px-5 font-sans whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isNight ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                          <span>{isNight ? '🌙' : '☀️'}</span>
                          <span>{isNight ? 'Night' : 'Day'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-5 font-sans text-slate-700 font-bold text-xs max-w-xs truncate">{staffDisplay}</td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-sans font-black tracking-widest uppercase ${isCash ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                          {l.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-sans text-slate-600 font-medium text-xs whitespace-nowrap">{l.customer_type || 'Walk-in'}</td>
                      <td className={`py-3 px-5 text-right font-black text-sm whitespace-nowrap ${isCash ? 'text-emerald-700' : 'text-indigo-700'}`}>
                        {settings.currency} {Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-5 font-sans text-slate-500 text-xs max-w-xs truncate">{l.notes || '—'}</td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewReceipt(l)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm" title="View/Print Receipt">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditEntry(l)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm" title="Edit Entry">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(l.id, l.invoice_number)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm" title="Void Entry">
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
      
      {/* Action Modals */}
      {viewReceipt && (
        <ReceiptModal 
          entry={viewReceipt} 
          settings={settings} 
          onClose={() => setViewReceipt(null)} 
        />
      )}
      
      {editEntry && (
        <EditLedgerModal 
          entry={editEntry} 
          onClose={() => setEditEntry(null)} 
          onSave={() => { setEditEntry(null); loadLedgers(); }} 
        />
      )}
    </div>
  );
}
