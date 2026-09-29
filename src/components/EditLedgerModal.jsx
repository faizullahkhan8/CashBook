import React, { useState } from 'react';
import { X, Save, FileEdit } from 'lucide-react';
import { api } from '../api';

export default function EditLedgerModal({ entry, onClose, onSave }) {
  const [amount, setAmount] = useState(String(entry.amount || ''));
  const [method, setMethod] = useState(entry.payment_method || 'CASH');
  const [customer, setCustomer] = useState(entry.customer_type || 'Walk-in Customer');
  const [notes, setNotes] = useState(entry.notes || '');
  const [loading, setLoading] = useState(false);
  
  if (!entry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.updateLedgerEntry(entry.id, {
      amount: parseFloat(amount) || 0,
      payment_method: method,
      customer_type: customer,
      notes: notes.trim()
    });
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col scale-100 border border-slate-200 dark:border-slate-800">
        
        <div className="px-6 py-4 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100">Edit Transaction</h3>
              <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{entry.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50/50">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-black text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Method</label>
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value)} 
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
                <option value="QR_CODE">QR CODE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</label>
              <select 
                value={customer} 
                onChange={e => setCustomer(e.target.value)} 
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="Walk-in Customer">Walk-in Customer</option>
                <option value="Regular Patient">Regular Patient</option>
                <option value="Prescription Delivery">Prescription Delivery</option>
                <option value="Hospital Staff">Hospital Staff</option>
                <option value="Emergency Care">Emergency Care</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Remarks</label>
            <input 
              type="text" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Optional remarks..."
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50">
              <Save className="w-4 h-4"/>
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
