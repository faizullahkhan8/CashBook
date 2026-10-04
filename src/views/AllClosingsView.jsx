import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import EditClosingModal from '../components/EditClosingModal';
import { 
  Archive, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Banknote, 
  CreditCard, 
  Receipt,
  Sun,
  Moon,
  Printer,
  Pencil,
  Trash2,
  Ban
} from 'lucide-react';

export default function AllClosingsView({ onSwitchToClosing }) {
  const { allClosings, settings, setCurrentView, updateClosing, voidClosing, openClosingDetails, openSlip, confirmAction } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); 
  const [shiftFilter, setShiftFilter] = useState('ALL'); 
  const [loading, setLoading] = useState(true);
  const [editClosing, setEditClosing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fake loading effect for UI Polish
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const activeClosings = allClosings.filter((closing) => !Number(closing.is_void));
  const totalClosingsSaved = activeClosings.length;
  const totalCashCounter = activeClosings.reduce((sum, c) => sum + (Number(c.cash_sales) || 0), 0);
  const totalOnline = activeClosings.reduce((sum, c) => sum + (Number(c.online_sales) || 0), 0);
  const totalRevenueClosed = totalCashCounter + totalOnline;

  const filteredClosings = allClosings.filter((c) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      c.closing_code?.toLowerCase().includes(s) ||
      c.cashier_name?.toLowerCase().includes(s) ||
      c.employee_1?.toLowerCase().includes(s) ||
      c.employee_2?.toLowerCase().includes(s);

    const matchesShift = shiftFilter === 'ALL' || c.shift_type === shiftFilter;
    const isBalanced = Math.abs(c.variance || 0) < 0.01;
    
    const isVoid = Number(c.is_void) === 1;
    if (filterTab === 'Void') return matchesSearch && matchesShift && isVoid;
    if (filterTab === 'Balanced') return matchesSearch && matchesShift && !isVoid && isBalanced;
    if (filterTab === 'Variance') return matchesSearch && matchesShift && !isVoid && !isBalanced;
    return matchesSearch && matchesShift;
  });

  const handleEdit = async (data) => {
    if (!editClosing) return;
    setIsSaving(true);
    const updated = await updateClosing(editClosing.id, data);
    setIsSaving(false);
    if (updated) setEditClosing(null);
  };

  const handleVoid = async (closing) => {
    const reason = await confirmAction({
      title: 'Mark Closing as VOID?',
      message: 'The closing will be excluded from totals. Its ledgers and short items will remain preserved.',
      details: closing.closing_code,
      confirmText: 'Mark as VOID',
      requireInput: true,
      inputLabel: 'Void Reason',
      inputPlaceholder: 'Explain why this closing is being voided...',
    });
    if (reason === null) return;
    await voidClosing(closing.id, reason);
  };

  const hasActiveFilters = searchQuery || filterTab !== 'ALL' || shiftFilter !== 'ALL';

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">All Closings Archive</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Permanently recorded shift closings with shift type and dual employee records
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onSwitchToClosing) onSwitchToClosing();
            else setCurrentView('closing');
          }}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Shift Closing</span>
        </button>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Closings Saved</span>
          <div className="text-2xl lg:text-3xl font-black text-slate-800 font-mono my-2">{totalClosingsSaved}</div>
          <span className="text-xs font-semibold text-slate-400">Recorded shifts</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-2xl border border-emerald-700 shadow-lg shadow-emerald-900/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Net Sale (All)</span>
            <Receipt className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalRevenueClosed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-bold text-emerald-200">Cash + Online aggregated</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Cash Counter</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-800 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalCashCounter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Cash register intake</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Total Online</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-indigo-800 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalOnline.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Digital & card payments</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Revenue Closed</span>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 font-mono my-2 whitespace-nowrap">
            {settings.currency} {totalRevenueClosed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs font-semibold text-slate-400">Cash + Online aggregated</span>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50">
          <h3 className="font-black text-sm text-slate-800 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Finalized Closings Ledger ({filteredClosings.length})</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search closing ID / staff..."
                className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm font-medium transition-all"
              />
            </div>

            <div className="flex rounded-xl bg-slate-200/50 p-1 text-xs font-bold shadow-inner border border-slate-200/50">
              <button onClick={() => setShiftFilter('ALL')} className={`px-4 py-1.5 rounded-lg transition-all ${shiftFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Shifts</button>
              <button onClick={() => setShiftFilter('Day')} className={`px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${shiftFilter === 'Day' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Sun className="w-3.5 h-3.5" /><span>Day</span></button>
              <button onClick={() => setShiftFilter('Night')} className={`px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${shiftFilter === 'Night' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Moon className="w-3.5 h-3.5" /><span>Night</span></button>
            </div>

            <div className="flex rounded-xl bg-slate-200/50 p-1 text-xs font-bold shadow-inner border border-slate-200/50">
              {['ALL', 'Balanced', 'Variance', 'Void'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    filterTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 border-b border-slate-200">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-3 px-5">Closing ID</th>
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Shift</th>
                <th className="py-3 px-5">Staff (Both)</th>
                <th className="py-3 px-5 text-right">Float</th>
                <th className="py-3 px-5 text-right">Cash Counter</th>
                <th className="py-3 px-5 text-right">Short Items</th>
                <th className="py-3 px-5 text-right">Online</th>
                <th className="py-3 px-5 text-right">Total Closed</th>
                <th className="py-3 px-5 text-center">Till Status</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse even:bg-slate-50/40">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-5 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                    <td className="py-4 px-5"><div className="h-7 w-14 bg-slate-200 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredClosings.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 animate-fade-in space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                        <Archive className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-slate-700">No shift closings found</p>
                        <p className="text-sm text-slate-400 mt-1">Adjust filters or close a new shift.</p>
                      </div>
                      {hasActiveFilters && (
                        <button onClick={() => { setSearchQuery(''); setFilterTab('ALL'); setShiftFilter('ALL'); }} className="mt-2 text-emerald-600 font-bold text-sm hover:underline">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClosings.map((c) => {
                  const isVoid = Number(c.is_void) === 1;
                  const isBalanced = Math.abs(c.variance || 0) < 0.01;
                  const isShortage = (c.variance || 0) < -0.01;
                  const isNight = c.shift_type === 'Night';
                  const dateStr = c.closed_at ? new Date(c.closed_at).toLocaleDateString() : '';
                  const timeStr = c.closed_at ? new Date(c.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                  const staffDisplay = c.employee_1 && c.employee_2 ? `${c.employee_1} & ${c.employee_2}` : c.cashier_name || '—';
                  const shortItemsAmount = Math.max(
                    0,
                    Number(c.opening_float || 0) + Number(c.cash_sales || 0) - Number(c.expected_drawer_cash || 0)
                  );

                  return (
                    <tr key={c.id} className={`hover:bg-slate-50/70 even:bg-slate-50/40 transition-colors ${isVoid ? 'opacity-60 bg-slate-100/80' : ''}`}>
                      <td className="py-3 px-5 font-bold text-slate-900 whitespace-nowrap">{c.closing_code}</td>
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
                      <td className="py-3 px-5 font-sans text-slate-800 font-bold text-xs max-w-xs truncate">{staffDisplay}</td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">{settings.currency} {Number(c.opening_float || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-black text-emerald-700 whitespace-nowrap">{settings.currency} {Number(c.cash_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-black text-rose-600 whitespace-nowrap">- {settings.currency} {shortItemsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right text-indigo-700 font-black whitespace-nowrap">{settings.currency} {Number(c.online_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-black text-slate-900 whitespace-nowrap">{settings.currency} {Number(c.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-[10px] font-sans font-black uppercase tracking-wider shadow-sm ${
                          isVoid ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                          isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isShortage ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isVoid ? <Ban className="w-3.5 h-3.5" /> : isBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{isVoid ? 'VOID' : isBalanced ? 'Balanced' : 'Variance'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openClosingDetails(c)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-sans font-bold flex items-center space-x-1.5 transition-colors shadow-sm active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openSlip(c)}
                            className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Print closing (Thermal or A4)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isVoid && <button
                            type="button"
                            onClick={() => setEditClosing(c)}
                            className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition-colors"
                            title="Edit closing"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>}
                          {!isVoid && <button type="button" onClick={() => handleVoid(c)} className="p-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors" title="Void closing (entries stay preserved)">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>}
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

      <EditClosingModal
        closing={editClosing}
        currency={settings.currency}
        saving={isSaving}
        onClose={() => setEditClosing(null)}
        onSave={handleEdit}
      />
    </div>
  );
}
