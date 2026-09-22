import React from 'react';
import { FileText, Printer, X } from 'lucide-react';
import { api } from '../api';

export default function ReceiptModal({ entry, settings, onClose }) {
  if (!entry) return null;
  
  const handlePrint = (format) => {
    const body = document.body;
    const style = document.createElement('style');
    style.id = 'ledger-receipt-print-page-size';
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
    setTimeout(() => window.print(), 100);
  };
  
  const dateStr = entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A';
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:bg-transparent print:backdrop-blur-none print:p-0 print:flex-col print:items-start animate-fade-in">
      <div className="print-document-shell bg-white rounded-2xl shadow-2xl max-w-xs w-full border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:overflow-visible scale-100">
        
        <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between no-print">
          <span className="font-semibold text-sm">Receipt Viewer</span>
          <button onClick={onClose} className="text-slate-300 hover:text-white rounded-lg p-1 hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 font-mono text-xs text-slate-800 space-y-4 print-receipt bg-white">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-base font-sans tracking-tight">{settings?.pharmacy_name || 'ZADA PHARMACY'}</h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Payment Receipt</p>
            <p className="text-[10px] text-slate-500 font-sans">{entry.register_station || settings?.register_station || 'Register 01'}</p>
          </div>
          
          <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Inv No:</span>
              <span className="font-bold">{entry.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-bold">{entry.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="truncate max-w-[120px] text-right">{entry.customer_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Staff:</span>
              <span className="truncate max-w-[120px] text-right">{entry.employee_1 || 'Staff'}</span>
            </div>
          </div>
          
          <div className="py-2 border-b border-dashed border-slate-300 text-sm font-bold flex items-center justify-between">
            <span>TOTAL:</span>
            <span>{settings?.currency || 'PKR'} {Number(entry.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          
          {entry.notes && (
            <div className="text-[10px] text-slate-500 italic pb-2 border-b border-dashed border-slate-300">
              Notes: {entry.notes}
            </div>
          )}
          
          <div className="text-center text-[10px] text-slate-400 pt-2 pb-1">
            *** Thank you for your visit ***
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 no-print">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            Close
          </button>
          <button onClick={() => handlePrint('thermal')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm active:scale-95 transition-all">
            <Printer className="w-4 h-4" />
            <span>Thermal</span>
          </button>
          <button onClick={() => handlePrint('a4')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm active:scale-95 transition-all">
            <FileText className="w-4 h-4" />
            <span>A4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
