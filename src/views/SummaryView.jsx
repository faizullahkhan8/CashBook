import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  Banknote, 
  CreditCard, 
  Scale, 
  PlusCircle, 
  Printer, 
  Calendar, 
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function SummaryView() {
  const { summary, settings, setCurrentView, openSlip, activeShift } = useApp();

  const cashShareNum = parseFloat(summary.cashShare) || 0;
  const onlineShareNum = parseFloat(summary.onlineShare) || 0;

  const isNight = activeShift?.shift_type === 'Night';
  const staffDisplay = activeShift?.employee_1 && activeShift?.employee_2
    ? `${activeShift.employee_1} & ${activeShift.employee_2}`
    : activeShift?.cashier_name || 'Staff';

  const handlePreviewSlip = () => {
    const preliminaryClosing = {
      closing_code: 'DRAFT-SLIP',
      shift_id: activeShift?.id || 1,
      shift_type: activeShift?.shift_type || 'Day',
      employee_1: activeShift?.employee_1 || '',
      employee_2: activeShift?.employee_2 || '',
      cashier_name: staffDisplay,
      opening_float: summary.openingFloat,
      cash_sales: summary.cashInflow,
      online_sales: summary.onlineCollections,
      total_revenue: summary.totalRevenue,
      expected_drawer_cash: summary.expectedDrawerCash,
      counted_cash: summary.expectedDrawerCash, 
      variance: 0,
      status: 'In-Progress Draft',
      denominations_json: '{}',
      audit_notes: 'Preliminary shift summary slip before final closing.',
      closed_at: new Date().toISOString(),
    };
    openSlip(preliminaryClosing);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Executive Summary</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Live operational snapshot for current counter shift</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-xs font-black px-4 py-1.5 rounded-full shadow-sm flex items-center space-x-2 uppercase tracking-wide border ${
            isNight ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span>{isNight ? '🌙' : '☀️'}</span>
            <span>{isNight ? 'Night Shift' : 'Day Shift'}</span>
          </span>
          <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
            👥 {staffDisplay}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Total Shift Revenue */}
        <div className="bg-white p-6 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Shift Revenue
              </span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-bold text-slate-400">{settings.currency}</span>
              <span className="text-4xl font-black text-slate-900 tracking-tight truncate max-w-full">
                {summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-sm text-emerald-600 font-bold space-x-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{summary.totalCount} completed transactions</span>
          </div>
        </div>

        {/* Cash Inflow */}
        <div className="bg-white p-6 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Cash Inflow
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                DRAWER
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-bold text-emerald-600">{settings.currency}</span>
              <span className="text-4xl font-black text-emerald-800 tracking-tight truncate max-w-full">
                {summary.cashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500 flex justify-between items-center font-semibold">
            <span>{summary.cashCount} payments</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Share: {summary.cashShare}%</span>
          </div>
        </div>

        {/* Online Collections */}
        <div className="bg-white p-6 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-indigo-500 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Online Collections
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800">
                CARDS/UPI
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-bold text-indigo-500">{settings.currency}</span>
              <span className="text-4xl font-black text-indigo-800 tracking-tight truncate max-w-full">
                {summary.onlineCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500 flex justify-between items-center font-semibold">
            <span>{summary.onlineCount} payments</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Share: {summary.onlineShare}%</span>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white p-6 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Total Spend
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-rose-100 text-rose-800">
                SHORT ITEMS
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-bold text-rose-500">{settings.currency}</span>
              <span className="text-4xl font-black text-rose-800 tracking-tight truncate max-w-full">
                {(summary.totalSpentOnShortItems || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500 font-semibold">
            Cash utilized from drawer
          </div>
        </div>

        {/* Net Cash (Cash - Spend) */}
        <div className="bg-white p-6 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-teal-500 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Net Cash
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-teal-100 text-teal-800">
                CASH - SPEND
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-bold text-teal-600">{settings.currency}</span>
              <span className="text-4xl font-black text-teal-800 tracking-tight truncate max-w-full">
                {(summary.cashInflow - (summary.totalSpentOnShortItems || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500 font-semibold">
            Drawer actual inflow
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 tracking-tight">Payment Split</h3>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner gap-0.5">
          {cashShareNum > 0 && (
            <div
              style={{ width: `${cashShareNum}%` }}
              className="bg-emerald-500 h-full flex items-center justify-center transition-all duration-500"
            >
              {cashShareNum > 10 && <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">CASH {summary.cashShare}%</span>}
            </div>
          )}
          {onlineShareNum > 0 && (
            <div
              style={{ width: `${onlineShareNum}%` }}
              className="bg-indigo-500 h-full flex items-center justify-center transition-all duration-500"
            >
              {onlineShareNum > 10 && <span className="text-[10px] font-black text-indigo-50 uppercase tracking-widest">ONLINE {summary.onlineShare}%</span>}
            </div>
          )}
          {summary.totalRevenue === 0 && (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Sales Yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Operational Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span className="font-black text-base uppercase tracking-tight">Shift Active</span>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Register is open and accepting real-time ledger entries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('ledger')}
            className="mt-6 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Enter Transaction</span>
          </button>
        </div>

        {/* Register Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-base">Register Details</span>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Terminal</span>
                <span className="font-bold text-slate-800">{settings.register_station}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Shift Code</span>
                <span className="font-mono font-bold text-slate-700">{activeShift?.shift_code || 'SHF-ACTIVE'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Opening Float</span>
                <span className="font-mono font-black text-slate-800">
                  {settings.currency} {summary.openingFloat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 text-rose-600">
                <span className="font-medium">Short Items (Spent)</span>
                <span className="font-mono font-black">
                  - {settings.currency} {(summary.totalSpentOnShortItems || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-700 font-bold">Expected Cash</span>
                <span className="font-mono font-black text-emerald-700">
                  {settings.currency} {summary.expectedDrawerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('closing')}
            className="mt-6 w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Scale className="w-4 h-4" />
            <span>Go To Drawer Closing</span>
          </button>
        </div>

        {/* Generate Shift Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-base">Shift Report</span>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Preview current shift ledger before running the end-of-shift reconciliation.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePreviewSlip}
            className="mt-6 w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Preview Shift Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
