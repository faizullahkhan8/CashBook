import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, FileText, Sparkles } from 'lucide-react';
import LedgerEntryTerminal from './LedgerEntryTerminal';
import AllLedgersView from './AllLedgersView';

export default function LedgerEntryView({ initialTab = 'entry' }) {
  const { currentView, setCurrentView, summary, activeShift } = useApp();

  const [activeTab, setActiveTab] = useState(
    currentView === 'all-ledgers' || initialTab === 'archive' ? 'archive' : 'entry'
  );

  // Synchronize with currentView changes externally (e.g. sidebar navigation)
  useEffect(() => {
    if (currentView === 'all-ledgers') {
      setActiveTab('archive');
    } else if (currentView === 'ledger') {
      setActiveTab('entry');
    }
  }, [currentView]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'archive') {
      setCurrentView('all-ledgers');
    } else {
      setCurrentView('ledger');
    }
  };

  const isNight = activeShift?.shift_type === 'Night';

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 overflow-hidden">
      {/* Top Layout Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs z-10">
        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleTabChange('entry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'entry'
                ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Counter Terminal</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'entry'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isNight ? 'Night' : 'Day'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('archive')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'archive'
                ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Ledgers Archive</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'archive'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {summary.totalCount || 0}
            </span>
          </button>
        </div>

        {/* Right Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-bold text-slate-700">Register 01</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-600">
            {activeTab === 'entry' ? 'Live Sales Mode' : 'Master Database Mode'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'entry' && (
          <LedgerEntryTerminal onSwitchToArchive={() => handleTabChange('archive')} />
        )}
        {activeTab === 'archive' && (
          <AllLedgersView onSwitchToEntry={() => handleTabChange('entry')} />
        )}
      </div>
    </div>
  );
}
