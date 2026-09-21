import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Archive, Clock, Sparkles } from 'lucide-react';
import ShortItemsTerminal from './ShortItemsTerminal';
import AllShortItemsList from './AllShortItemsList';

export default function ShortItemsView({ initialTab = 'entry' }) {
  const { currentView, setCurrentView, summary, activeShift, shortItems } = useApp();

  const [activeTab, setActiveTab] = useState(
    currentView === 'all-short-items' || initialTab === 'list' ? 'list' : 'entry'
  );

  // Synchronize with external view switches (e.g. sidebar navigation)
  useEffect(() => {
    if (currentView === 'all-short-items') {
      setActiveTab('list');
    } else if (currentView === 'short-items') {
      setActiveTab('entry');
    }
  }, [currentView]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'list') {
      setCurrentView('all-short-items');
    } else {
      setCurrentView('short-items');
    }
  };

  const isNight = activeShift?.shift_type === 'Night';
  const pendingCount = summary.pendingShortItemsCount || 0;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#090d16] overflow-hidden transition-colors">
      {/* Top Layout Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs z-10">
        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-2">
          {/* Tab 1: Issue Cash Terminal */}
          <button
            type="button"
            onClick={() => handleTabChange('entry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'entry'
                ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Issue Cash Terminal</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'entry'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {isNight ? 'Night' : 'Day'}
            </span>
          </button>

          {/* Tab 2: All Short Items List */}
          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>All Short Items List</span>
            {pendingCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-500 text-white shadow-xs">
                {pendingCount} Pending
              </span>
            ) : (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'list'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {shortItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-bold text-slate-700 dark:text-slate-200">Register 01</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">
            {activeTab === 'entry' ? 'Live Issue Mode' : 'Historical Archive Mode'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'entry' && (
          <ShortItemsTerminal onSwitchToList={() => handleTabChange('list')} />
        )}
        {activeTab === 'list' && (
          <AllShortItemsList onSwitchToTerminal={() => handleTabChange('entry')} />
        )}
      </div>
    </div>
  );
}
