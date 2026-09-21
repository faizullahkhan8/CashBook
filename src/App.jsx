import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import LedgerEntryView from './views/LedgerEntryView';
import SummaryView from './views/SummaryView';
import ClosingView from './views/ClosingView';
import AllClosingsView from './views/AllClosingsView';
import AllLedgersView from './views/AllLedgersView';
import ShortItemsView from './views/ShortItemsView';
import ReportsAuditView from './views/ReportsAuditView';
import SlipModal from './components/SlipModal';
import ShiftStaffModal from './components/ShiftStaffModal';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const {
    currentView,
    selectedClosingForSlip,
    isSlipModalOpen,
    closeSlip,
    isStaffModalOpen,
    setIsStaffModalOpen,
    notification,
  } = useApp();

  const titles = {
    ledger: 'Ledger Entry',
    summary: 'Executive Summary',
    'short-items': 'Short Items Tracking',
    'all-short-items': 'Short Items Master History',
    closing: 'Closing & Reconciliation',
    'all-closings': 'All Closings Archive',
    'all-ledgers': 'Master Ledger Records',
    settings: 'Settings & Backups',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <TopHeader title={titles[currentView] || 'POS Cash Counter'} />

        {/* Dynamic View */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentView === 'ledger' && <LedgerEntryView initialTab="entry" />}
          {currentView === 'summary' && <SummaryView />}
          {currentView === 'short-items' && <ShortItemsView initialTab="entry" />}
          {currentView === 'all-short-items' && <ShortItemsView initialTab="list" />}
          {currentView === 'closing' && <ClosingView initialTab="reconcile" />}
          {currentView === 'all-closings' && <ClosingView initialTab="archive" />}
          {currentView === 'all-ledgers' && <LedgerEntryView initialTab="archive" />}
          {currentView === 'settings' && <ReportsAuditView />}
        </main>
      </div>

      {/* Printable / Viewable Slip Modal */}
      {isSlipModalOpen && selectedClosingForSlip && (
        <SlipModal
          closing={selectedClosingForSlip}
          onClose={closeSlip}
        />
      )}

      {/* Shift & Employee Setup Modal */}
      <ShiftStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-slide-in-right ${
          notification.type === 'success' 
            ? 'bg-emerald-950 text-emerald-50 border-emerald-900/50 shadow-emerald-900/20' 
            : notification.type === 'error' 
            ? 'bg-rose-950 text-rose-50 border-rose-900/50 shadow-rose-900/20' 
            : 'bg-slate-900 text-white border-slate-700 shadow-slate-900/20'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
          <span className="leading-snug">{notification.message}</span>
        </div>
      )}
    </div>
  );
}
