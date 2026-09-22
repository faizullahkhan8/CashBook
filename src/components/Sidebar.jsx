import React from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  BarChart2,
  Scale,
  Archive,
  FileText,
  Users,
  Pill,
  Activity,
  Settings,
  ShoppingCart,
  Sun,
  Moon,
  Code2
} from 'lucide-react';

export default function Sidebar() {
  const { currentView, setCurrentView, allClosings, summary, activeShift, setIsStaffModalOpen, theme, toggleTheme } = useApp();

  const navItems = [
    {
      id: 'summary',
      label: 'Summary',
      icon: BarChart2,
      badge: null,
    },
    {
      id: 'ledger',
      label: 'Ledger Entry',
      icon: DollarSign,
      badge: summary.totalCount > 0 ? {
        text: String(summary.totalCount),
        color: 'bg-slate-700 text-slate-300'
      } : null,
    },
    {
      id: 'short-items',
      label: 'Short Items',
      icon: ShoppingCart,
      badge: summary.pendingShortItemsCount > 0 ? {
        text: `${summary.pendingShortItemsCount} Pending`,
        color: 'bg-rose-500 text-white'
      } : null,
    },
    {
      id: 'closing',
      label: 'Closing',
      icon: Scale,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    }
  ];

  const isNight = activeShift?.shift_type === 'Night';
  const staffDisplay = activeShift?.employee_1 && activeShift?.employee_2
    ? `${activeShift.employee_1} & ${activeShift.employee_2}`
    : activeShift?.cashier_name || 'Staff';

  return (
    <aside className="w-64 bg-[#0a1226] text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none relative z-10 shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-700/80 flex items-center space-x-3.5 bg-gradient-to-r from-[#172044] to-[#27325b] shadow-lg shadow-black/10">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="Zada Logo"
            className={`w-full h-full object-contain ${theme === 'dark' ? 'hidden' : 'block'} dark:hidden`}
          />
          <img
            src="/logo-dark.png"
            alt="Zada Logo"
            className={`w-full h-full object-contain ${theme === 'dark' ? 'block' : 'hidden'} hidden dark:block`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-black tracking-widest text-white uppercase truncate">
            Zada Pharmacy
          </h1>
          <p className="text-[10px] font-bold text-blue-200/90 tracking-wider truncate uppercase mt-0.5">
            Cash Counter
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
        <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Workflow
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (item.id === 'ledger' && currentView === 'all-ledgers') ||
            (item.id === 'closing' && (currentView === 'all-closings' || currentView === 'closing-details')) ||
            (item.id === 'short-items' && currentView === 'all-short-items');
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`relative w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? 'bg-slate-800/80 text-white'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#27325b] rounded-r-full shadow-[0_0_8px_rgba(39,50,91,0.8)]"></div>
              )}

              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-[#27325b]/60 text-blue-200' : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${isActive
                    ? 'bg-[#27325b] text-white shadow-sm'
                    : item.badge.color
                    }`}
                >
                  {item.badge.text}
                </span>
              )}
            </button>
          );
        })}

        {/* Shift & Staff Setup Navigation Button */}
        <div className="pt-6">
          <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <span className={isNight ? 'text-indigo-400' : 'text-amber-400'}>
              {isNight ? 'Night Staff' : 'Day Staff'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all duration-150 border border-slate-800/60 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:text-[#27325b] group-hover:bg-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Staff & Roster</span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-md font-bold shadow-sm ${isNight ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-800' : 'bg-amber-900/60 text-amber-300 border border-amber-800'
              }`}>
              {isNight ? '🌙 Night' : '☀️ Day'}
            </span>
          </button>

          {/* Quick Theme Switcher Button
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full mt-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all duration-150 border border-slate-800/60 group cursor-pointer"
            title="Toggle between Light and Dark mode"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:text-amber-300 transition-colors">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </div>
              <span className="text-xs font-bold text-slate-300">Theme</span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-md font-bold shadow-sm uppercase ${
              theme === 'dark' ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </span>
          </button> */}
        </div>
      </div>

      {/* System Status / Network */}
      <div className="m-4 rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#27325b]/20 blur-2xl rounded-full"></div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm text-slate-200">Register 01</span>
          </div>
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Online</span>
          </span>
        </div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Active Shift</span>
            <span className={`font-bold ${isNight ? 'text-indigo-400' : 'text-amber-400'}`}>
              {isNight ? '🌙 Night' : '☀️ Day'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">On Duty</span>
            <span className="font-bold text-slate-300 max-w-[100px] truncate" title={staffDisplay}>
              {staffDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Developer Credits Card */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Developed by Zada IT
            </div>
            <div className="text-[11px] font-bold text-slate-200 truncate" title="Humayun Khan & Faizullah">
              Humayun Khan & Faizullah
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
