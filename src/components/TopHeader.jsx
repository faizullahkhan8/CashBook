import React from 'react';
import { Calendar, Sun, Moon, Users, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TopHeader({ title }) {
  const { activeShift, setIsStaffModalOpen, theme, toggleTheme } = useApp();
  
  // Format date nicely: "Mon, 21 Sep 2026"
  const dateOpts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const todayStr = new Date().toLocaleDateString('en-US', dateOpts);
  
  const isNight = activeShift?.shift_type === 'Night';
  const isDark = theme === 'dark';
  const emp1 = activeShift?.employee_1 || 'Employee 1';
  const emp2 = activeShift?.employee_2 || 'Employee 2';

  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white dark:bg-[#0f172a] dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-20 shadow-sm shadow-slate-100/50 dark:shadow-none transition-colors">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-3.5">
        {/* Shift & Staff Button */}
        <button
          type="button"
          onClick={() => setIsStaffModalOpen(true)}
          className={`group flex items-center space-x-3 px-1.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-sm ${
            isNight
              ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300'
              : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800 hover:border-amber-300'
          }`}
          title="Click to switch shift or change assigned employees"
        >
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-white shadow-inner ${
            isNight ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
          }`}>
            {isNight ? (
              <Moon className="w-3.5 h-3.5 fill-white/20" />
            ) : (
              <Sun className="w-3.5 h-3.5 fill-white/20" />
            )}
            <span className="font-bold tracking-wide">{isNight ? 'NIGHT' : 'DAY'}</span>
          </div>

          <div className="flex items-center space-x-1.5 max-w-[200px] truncate text-slate-700 dark:text-slate-200 pr-1">
            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{emp1} & {emp2}</span>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-600 transition-colors mr-1">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* Date pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* Theme Toggle Button - High Visibility */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer select-none ${
            isDark
              ? 'bg-slate-800 border-indigo-500/40 text-amber-300 hover:bg-slate-700 hover:text-amber-200 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 ring-2 ring-slate-200/50'
          }`}
          title={isDark ? 'Currently in Dark Mode. Click to switch to Light Mode' : 'Currently in Light Mode. Click to switch to Dark Mode'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-300 fill-amber-300/30" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {/* Register Active status pill */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline">Register Active</span>
        </div>
      </div>
    </header>
  );
}
