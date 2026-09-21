import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Scale, Archive, Clock, ShieldCheck } from 'lucide-react';
import ShiftClosingReconciliation from './ShiftClosingReconciliation';
import AllClosingsView from './AllClosingsView';

export default function ClosingView({ initialTab = 'reconcile' }) {
  const { currentView, setCurrentView, allClosings, activeShift } = useApp();

  const [activeTab, setActiveTab] = useState(
    currentView === 'all-closings' || initialTab === 'archive' ? 'archive' : 'reconcile'
  );

  // Synchronize when currentView changes externally (e.g. from sidebar navigation or after finalizeClosing)
  useEffect(() => {
    if (currentView === 'all-closings') {
      setActiveTab('archive');
    } else if (currentView === 'closing') {
      setActiveTab('reconcile');
    }
  }, [currentView]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'archive') {
      setCurrentView('all-closings');
    } else {
      setCurrentView('closing');
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
            onClick={() => handleTabChange('reconcile')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'reconcile'
                ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Shift Closing</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'reconcile'
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
            <Archive className="w-4 h-4" />
            <span>All Closings Archive</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'archive'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allClosings.length}
            </span>
          </button>
        </div>

        {/* Right Status Badge */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-bold text-slate-700">Register 01</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-600">
            {activeTab === 'reconcile' ? 'Active Reconciliation Mode' : 'Archived Records Mode'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'reconcile' && (
          <ShiftClosingReconciliation onSwitchToArchive={() => handleTabChange('archive')} />
        )}
        {activeTab === 'archive' && (
          <AllClosingsView onSwitchToClosing={() => handleTabChange('reconcile')} />
        )}
      </div>
    </div>
  );
}
