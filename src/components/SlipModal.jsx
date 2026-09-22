import React from 'react';
import { Printer, X, CheckCircle, AlertTriangle, Building, FileSpreadsheet, Sun, Moon, Users } from 'lucide-react';
import { api } from '../api';

export default function SlipModal({ closing, onClose }) {
  if (!closing) return null;

  let denominations = {};
  try {
    denominations = typeof closing.denominations_json === 'string' 
      ? JSON.parse(closing.denominations_json) 
      : closing.denominations_json || {};
  } catch (e) {
    denominations = {};
  }

  const handlePrint = (format) => {
    const body = document.body;
    const style = document.createElement('style');
    style.id = 'closing-print-page-size';
    style.textContent = format === 'thermal'
      ? '@page { size: 80mm auto; margin: 0; }'
      : '@page { size: A4 portrait; margin: 12mm; }';
    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);
    body.classList.remove('print-thermal', 'print-a4');
    body.classList.add(format === 'thermal' ? 'print-thermal' : 'print-a4');

    const cleanup = () => {
      body.classList.remove('print-thermal', 'print-a4');
      document.getElementById(style.id)?.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    api.printSlip();
  };

  const isBalanced = Math.abs(closing.variance || 0) < 0.01;
  const isShortage = (closing.variance || 0) < -0.01;
  const isVoid = Number(closing.is_void) === 1;
  const isNight = closing.shift_type === 'Night';
  const staffDisplay = closing.employee_1 && closing.employee_2
    ? `${closing.employee_1} & ${closing.employee_2}`
    : closing.cashier_name || 'Staff';

  const noteLabels = [
    { key: '5000', label: 'Rs 5,000 Notes', value: 5000 },
    { key: '1000', label: 'Rs 1,000 Notes', value: 1000 },
    { key: '500',  label: 'Rs 500 Notes',   value: 500 },
    { key: '100',  label: 'Rs 100 Notes',   value: 100 },
    { key: '50',   label: 'Rs 50 Notes',    value: 50 },
    { key: '20',   label: 'Rs 20 Notes',    value: 20 },
    { key: '10',   label: 'Rs 10 Notes',    value: 10 },
    { key: 'coins', label: 'Coins',         value: 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:bg-transparent print:backdrop-blur-none print:p-0 print:flex-col print:items-start">
      <div className="print-document-shell bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-h-none print:max-w-none print:overflow-visible">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm">Shift Closing Slip — {closing.closing_code}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white rounded-lg p-1 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Slip Content */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 space-y-4 print-receipt bg-white dark:bg-slate-900">
          {Number(closing.is_void) === 1 && (
            <div className="rounded-lg border-2 border-rose-500 bg-rose-50 p-3 text-center text-rose-700 font-sans">
              <div className="font-black text-lg tracking-widest">VOID</div>
              <div className="text-xs font-semibold mt-1">Reason: {closing.void_reason || 'Not provided'}</div>
            </div>
          )}
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-base text-slate-900 tracking-tight font-sans">
              ZADA PHARMACY
            </h3>
            <p className="text-[11px] text-slate-600 font-sans">POS CASH COUNTER & CLOSINGS</p>
            <p className="text-[10px] text-slate-500 font-sans">Register 01 • Main Cash Counter</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-700 text-xs">
              SHIFT CLOSING SLIP
            </div>
          </div>

          {/* Metadata with Shift & Dual Staff */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Closing Ref:</span>
              <span className="font-bold">{closing.closing_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Closed At:</span>
              <span>{closing.closed_at ? new Date(closing.closed_at).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shift:</span>
              <span className="font-bold text-slate-800">
                {isNight ? '🌙 Night Shift' : '☀️ Day Shift'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Staff On Duty (Both):</span>
              <span className="font-semibold text-slate-900">{staffDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Till Status:</span>
              <span className={`font-bold ${isVoid ? 'text-slate-600' : isBalanced ? 'text-emerald-700' : isShortage ? 'text-rose-600' : 'text-amber-600'}`}>
                {isVoid ? 'VOID' : closing.status || (isBalanced ? 'Balanced' : 'Variance')}
              </span>
            </div>
          </div>

          {/* Shift Revenue Breakdown */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-300">
            <p className="font-bold text-slate-700 font-sans uppercase text-[10px] tracking-wider">
              Shift Sales Revenue
            </p>
            <div className="flex justify-between">
              <span>(+) Cash Counter Inflow:</span>
              <span className="font-semibold">PKR {Number(closing.cash_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Online / Gateway:</span>
              <span className="font-semibold">PKR {Number(closing.online_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-xs">
              <span>Total Revenue Closed:</span>
              <span>PKR {Number(closing.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Drawer Reconciliation */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-300">
            <p className="font-bold text-slate-700 font-sans uppercase text-[10px] tracking-wider">
              Cash Drawer Reconciliation
            </p>
            <div className="flex justify-between">
              <span>(+) Opening Petty Cash:</span>
              <span>PKR {Number(closing.opening_float).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Shift Cash Inflow:</span>
              <span>PKR {Number(closing.cash_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(() => {
              const inferredShortItems = (Number(closing.opening_float || 0) + Number(closing.cash_sales || 0)) - Number(closing.expected_drawer_cash || 0);
              if (inferredShortItems > 0.01) {
                return (
                  <div className="flex justify-between text-rose-600">
                    <span>(-) Short Items Spent:</span>
                    <span>PKR {inferredShortItems.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>(=) Expected Drawer Cash:</span>
              <span>PKR {Number(closing.expected_drawer_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800">
              <span>(✓) Total Counted Drawer:</span>
              <span>PKR {Number(closing.counted_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between font-bold pt-1 border-t border-slate-200 ${
              isBalanced ? 'text-emerald-700' : isShortage ? 'text-rose-600' : 'text-amber-600'
            }`}>
              <span>Variance (Counted - Expected):</span>
              <span>
                {closing.variance > 0 ? '+' : ''}
                PKR {Number(closing.variance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Physical Denominations Table */}
          {Object.keys(denominations).length > 0 && (
            <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
              <p className="font-bold text-slate-700 font-sans uppercase text-[10px] tracking-wider">
                Physical Cash Breakdown
              </p>
              <div className="space-y-0.5 text-[11px]">
                {noteLabels.map((item) => {
                  const count = denominations[item.key] || 0;
                  if (count === 0) return null;
                  const total = count * item.value;
                  return (
                    <div key={item.key} className="flex justify-between">
                      <span className="text-slate-600">{item.label} × {count}:</span>
                      <span>PKR {total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit Notes */}
          {closing.audit_notes && (
            <div className="text-[11px] pb-2 border-b border-dashed border-slate-300">
              <span className="text-slate-500 font-sans font-semibold">Remarks / Notes:</span>
              <p className="mt-0.5 italic text-slate-700">{closing.audit_notes}</p>
            </div>
          )}

          {/* Signatures for Both Employees on Duty */}
          <div className="pt-3 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-600">
            <div>
              <div className="border-b border-slate-400 mb-1 pb-4 font-semibold truncate">
                {closing.employee_1 || 'Employee 1'}
              </div>
              <span className="text-slate-400">Lead Staff Sign</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-1 pb-4 font-semibold truncate">
                {closing.employee_2 || 'Employee 2'}
              </div>
              <span className="text-slate-400">Assistant Staff Sign</span>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-2">
            *** System Generated Shift Audit Slip • Zada Pharmacy ***
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => handlePrint('thermal')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Thermal Print</span>
          </button>
          <button
            type="button"
            onClick={() => handlePrint('a4')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>A4 Page Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
