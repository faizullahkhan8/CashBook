import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Scale,
  Banknote,
  CreditCard,
  Printer,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  Sun,
  Moon,
  Users,
  Archive,
  QrCode
} from 'lucide-react';

export default function ShiftClosingReconciliation({ onSwitchToArchive }) {
  const {
    activeShift,
    summary,
    settings,
    updateFloat,
    finalizeClosing,
    openSlip,
    setCurrentView,
  } = useApp();

  const [floatInput, setFloatInput] = useState(String(summary.openingFloat || 0));
  const [denominations, setDenominations] = useState({
    '5000': 0, '1000': 0, '500': 0, '100': 0, '50': 0, '20': 0, '10': 0, 'coins': 0,
  });
  const [confirmed, setConfirmed] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');
  const [carryOverFloat, setCarryOverFloat] = useState(false);

  // Closing Shift & Employee State
  const [closingShiftType, setClosingShiftType] = useState(activeShift?.shift_type || 'Day');
  const [closingEmp1, setClosingEmp1] = useState(activeShift?.employee_1 || '');
  const [closingEmp2, setClosingEmp2] = useState(activeShift?.employee_2 || '');

  useEffect(() => {
    setFloatInput(String(summary.openingFloat || 0));
  }, [summary.openingFloat]);

  useEffect(() => {
    if (activeShift) {
      setClosingShiftType(activeShift.shift_type || 'Day');
      setClosingEmp1(activeShift.employee_1 || '');
      setClosingEmp2(activeShift.employee_2 || '');
    }
  }, [activeShift]);

  // Denomination metadata with softer pastel backgrounds for better visual grouping
  const denomConfigs = [
    { key: '5000', label: 'Rs 5,000', type: 'NOTE', value: 5000, color: 'bg-emerald-50 text-emerald-800' },
    { key: '1000', label: 'Rs 1,000', type: 'NOTE', value: 1000, color: 'bg-teal-50 text-teal-800' },
    { key: '500', label: 'Rs 500', type: 'NOTE', value: 500, color: 'bg-cyan-50 text-cyan-800' },
    { key: '100', label: 'Rs 100', type: 'NOTE', value: 100, color: 'bg-blue-50 text-blue-800' },
    { key: '50', label: 'Rs 50', type: 'NOTE', value: 50, color: 'bg-indigo-50 text-indigo-800' },
    { key: '20', label: 'Rs 20', type: 'NOTE', value: 20, color: 'bg-violet-50 text-violet-800' },
    { key: '10', label: 'Rs 10', type: 'NOTE', value: 10, color: 'bg-purple-50 text-purple-800' },
    { key: 'coins', label: 'Coins', type: 'COIN', value: 1, color: 'bg-slate-50 text-slate-800' },
  ];

  const countedCash = denomConfigs.reduce((sum, item) => sum + (denominations[item.key] || 0) * item.value, 0);
  const currentFloat = parseFloat(floatInput) || 0;
  // Pending items deduct the full cash issued; settled items deduct the actual bill amount.
  const shortItemsDeduction = summary.totalShortItemsDeduction
    ?? ((summary.totalSpentOnShortItems || 0) + (summary.totalPendingShortItemsAmount || 0));
  const expectedDrawerCash = currentFloat + summary.cashInflow - shortItemsDeduction;
  const grandTotal = expectedDrawerCash + summary.onlineCollections;
  const variance = countedCash - expectedDrawerCash;
  const isBalanced = Math.abs(variance) < 0.01;
  const isShortage = variance < -0.01;
  const isSurplus = variance > 0.01;

  const handleDenomChange = (key, delta) => {
    setDenominations((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleDenomInput = (key, val) => {
    const num = parseInt(val, 10);
    setDenominations((prev) => ({ ...prev, [key]: isNaN(num) || num < 0 ? 0 : num }));
  };

  const handleClearDenoms = () => {
    setDenominations({ '5000': 0, '1000': 0, '500': 0, '100': 0, '50': 0, '20': 0, '10': 0, 'coins': 0 });
  };

  const handleAutoFillExpected = () => {
    let remaining = Math.floor(expectedDrawerCash);
    const newDenoms = { '5000': 0, '1000': 0, '500': 0, '100': 0, '50': 0, '20': 0, '10': 0, 'coins': 0 };
    const values = [5000, 1000, 500, 100, 50, 20, 10];
    for (const v of values) {
      if (remaining >= v) {
        const count = Math.floor(remaining / v);
        newDenoms[String(v)] = count;
        remaining -= count * v;
      }
    }
    newDenoms['coins'] = remaining;
    setDenominations(newDenoms);
  };

  const handleFloatPreset = async (val) => {
    setFloatInput(String(val));
    await updateFloat(val);
  };

  const handleFloatBlur = async () => {
    const num = parseFloat(floatInput) || 0;
    await updateFloat(num);
  };

  const handleFinalize = async () => {
    if (!confirmed) return;
    let status = 'Balanced';
    if (isShortage) status = `Variance (Shortage -${settings.currency} ${Math.abs(variance).toLocaleString()})`;
    if (isSurplus) status = `Variance (Surplus +${settings.currency} ${variance.toLocaleString()})`;

    await finalizeClosing({
      cashier_name: `${closingEmp1} & ${closingEmp2}`,
      shift_type: closingShiftType,
      employee_1: closingEmp1,
      employee_2: closingEmp2,
      opening_float: currentFloat,
      cash_sales: summary.cashInflow,
      online_sales: summary.onlineCollections,
      total_revenue: summary.totalRevenue,
      expected_drawer_cash: expectedDrawerCash,
      counted_cash: countedCash,
      variance,
      status,
      denominations_json: denominations,
      audit_notes: auditNotes || 'Register drawer counted and balanced against ledger.',
      carryOverFloatAsNewShift: carryOverFloat,
      next_shift_type: closingShiftType,
    });
  };

  const handlePreviewSlip = () => {
    let status = 'Balanced';
    if (isShortage) status = 'Variance Shortage';
    if (isSurplus) status = 'Variance Surplus';

    openSlip({
      closing_code: 'DRAFT-CLOSING',
      shift_id: activeShift?.id || 1,
      shift_type: closingShiftType,
      employee_1: closingEmp1,
      employee_2: closingEmp2,
      cashier_name: `${closingEmp1} & ${closingEmp2}`,
      opening_float: currentFloat,
      cash_sales: summary.cashInflow,
      online_sales: summary.onlineCollections,
      total_revenue: summary.totalRevenue,
      expected_drawer_cash: expectedDrawerCash,
      counted_cash: countedCash,
      variance,
      status,
      denominations_json: denominations,
      audit_notes: auditNotes,
      closed_at: new Date().toISOString(),
    });
  };

  const isNight = closingShiftType === 'Night';

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isNight ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
        <div className="flex items-center space-x-4 p-5 pl-7">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Shift Closing & Reconciliation</h2>
            <p className="text-sm font-medium text-slate-500">Reconcile physical drawer cash & finalize shift</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-5 pt-0 md:pt-5 bg-slate-50/50 rounded-bl-2xl md:rounded-bl-none h-full border-l border-slate-100">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider ${isNight ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
            {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>{isNight ? 'Night Shift' : 'Day Shift'}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-2 text-slate-700 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{closingEmp1} & {closingEmp2}</span>
          </div>
        </div>
      </div>

      {/* Opening Balance Input */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center space-x-3 lg:min-w-[220px]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Opening Petty Cash</h3>
              <p className="text-xs font-medium text-slate-400">Set balance before reviewing stats</p>
            </div>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-slate-400">
              {settings.currency}
            </span>
            <input
              type="number"
              step="any"
              value={floatInput}
              onChange={(e) => setFloatInput(e.target.value)}
              onBlur={handleFloatBlur}
              className="w-full h-12 pl-14 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-lg font-mono font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold mr-1">Presets:</span>
            {[0, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleFloatPreset(val)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-bold text-slate-700 shadow-sm transition-colors"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-slate-400 shadow-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">1. OPENING CASH</div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-slate-800 font-mono whitespace-nowrap">
            {settings.currency} {currentFloat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-sm font-medium text-slate-400 mt-1">Starting till balance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider">2. TOTAL CASH</div>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-emerald-800 font-mono whitespace-nowrap">
            {settings.currency} {summary.cashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-medium text-emerald-600 mt-1">{summary.cashCount} cash receipts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-blue-500 shadow-sm">
          <div className="flex justify-between items-center"><div className="text-sm font-bold text-blue-700 uppercase tracking-wider">3. TOTAL CARD</div><CreditCard className="w-4 h-4 text-blue-500" /></div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-blue-800 font-mono whitespace-nowrap">{settings.currency} {Number(summary.cardCollections || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-xs font-medium text-blue-600 mt-1">{summary.cardCount || 0} card payments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-violet-500 shadow-sm">
          <div className="flex justify-between items-center"><div className="text-sm font-bold text-violet-700 uppercase tracking-wider">4. TOTAL QR CODE</div><QrCode className="w-4 h-4 text-violet-500" /></div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-violet-800 font-mono whitespace-nowrap">{settings.currency} {Number(summary.qrCollections || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-xs font-medium text-violet-600 mt-1">{summary.qrCount || 0} QR payments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-rose-500 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold text-rose-700 uppercase tracking-wider">5. TOTAL SHORT ITEMS</div>
            <Minus className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-rose-800 font-mono whitespace-nowrap">
            - {settings.currency} {shortItemsDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-sm font-medium text-rose-600 mt-1">Cash utilized from drawer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold text-indigo-700 uppercase tracking-wider">6. TOTAL ONLINE</div>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-indigo-800 font-mono whitespace-nowrap">
            {settings.currency} {summary.onlineCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-sm font-medium text-indigo-600 mt-1">{summary.onlineCount} online payments</p>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border-y border-r border-emerald-200 border-l-4 border-l-teal-500 shadow-sm">
          <div className="text-sm font-bold text-teal-700 uppercase tracking-wider">7. NET CASH</div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-teal-800 font-mono whitespace-nowrap">
            {settings.currency} {expectedDrawerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-bold text-teal-600 mt-1">Opening + Cash − Short Items</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 border-l-4 border-l-blue-400 shadow-sm">
          <div className="text-sm font-bold text-blue-200 uppercase tracking-wider">8. GRAND TOTAL</div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-white font-mono whitespace-nowrap">
            {settings.currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-bold text-slate-300 mt-1">Net Cash + Total Online</p>
        </div>
      </div>

      {/* Two Column Working Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (5/12) */}
        <div className="lg:col-span-5 space-y-6">

          {/* <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800">Online / Card Payments</h3>
            </div>
            <div className="pt-2 flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-indigo-700 font-mono tracking-tight">
                  {settings.currency} {summary.onlineCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Collected from {summary.onlineCount} transaction{summary.onlineCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center opacity-70">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div> */}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-800">Finalize Shift Closing</h3>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Active Shift Session:</span>
                <span className="text-[11px] text-slate-400 font-medium">Shift remains {closingShiftType} unless manually changed</span>
              </div>
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg ${isNight ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                {isNight ? '🌙 Night Shift' : '☀️ Day Shift'}
              </span>
            </div>

            <div>
              <textarea
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Closing notes (optional)..."
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={carryOverFloat}
                onChange={(e) => setCarryOverFloat(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">Carry over cash as next float</span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="text-xs font-medium text-amber-900 leading-snug">
                I confirm the physical cash has been counted and verified by both on-duty staff members.
              </span>
            </label>

            {summary.pendingShortItemsCount > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col space-y-3">
                <div className="flex items-start space-x-2.5 text-rose-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-bold">
                    You have {summary.pendingShortItemsCount} pending Short Item(s) that must be resolved before closing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('short-items')}
                  className="self-end px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Go to Short Items
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={handlePreviewSlip}
                className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center justify-center space-x-2 border border-slate-200 transition-all shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                disabled={!confirmed || summary.pendingShortItemsCount > 0}
                onClick={handleFinalize}
                className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${confirmed && summary.pendingShortItemsCount === 0
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize Closing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7/12) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-500" />
                <span>Denomination Counter</span>
              </h3>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAutoFillExpected}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDenoms}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {denomConfigs.map((item) => {
                const count = denominations[item.key] || 0;
                const lineTotal = count * item.value;
                return (
                  <div
                    key={item.key}
                    className={`py-2 px-3 flex items-center justify-between rounded-xl border border-slate-100 transition-colors ${item.color} bg-opacity-40 hover:bg-opacity-70`}
                  >
                    <div className="flex items-center space-x-3 w-32">
                      <span className="font-mono text-sm font-black">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border border-white/50">
                      <button
                        type="button"
                        onClick={() => handleDenomChange(item.key, -1)}
                        className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleDenomInput(item.key, e.target.value)}
                        className="w-14 h-8 text-center font-mono font-black text-sm bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDenomChange(item.key, 1)}
                        className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="min-w-[120px] text-right font-mono text-sm font-black whitespace-nowrap">
                      {settings.currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Total Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none relative overflow-hidden">
            {/* Subtle background glow */}
            <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${isBalanced ? 'bg-emerald-500' : isShortage ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>

            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                Total Counted Cash
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight mt-1 whitespace-nowrap">
                {settings.currency} {countedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2 relative z-10">
              <span className="text-sm text-slate-300 font-mono font-semibold bg-slate-800 px-3 py-1 rounded-lg">
                EXPECTED: {settings.currency} {expectedDrawerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>

              {isBalanced && (
                <span className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-black flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>EXACTLY BALANCED</span>
                </span>
              )}

              {isShortage && (
                <span className="px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-black flex items-center space-x-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span>SHORTAGE: -{settings.currency} {Math.abs(variance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}

              {isSurplus && (
                <span className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-black flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>SURPLUS: +{settings.currency} {variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
