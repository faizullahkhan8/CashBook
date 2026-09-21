import React from 'react';
import { Calendar, Sun, Moon, Users, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TopHeader({ title }) {
  const { activeShift, setIsStaffModalOpen } = useApp();
  
  // Format date nicely: "Mon, 21 Sep 2026"
  const dateOpts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const todayStr = new Date().toLocaleDateString('en-US', dateOpts);
  
  const isNight = activeShift?.shift_type === 'Night';
  const emp1 = activeShift?.employee_1 || 'Employee 1';
  const emp2 = activeShift?.employee_2 || 'Employee 2';

  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-20 shadow-sm shadow-slate-100/50">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-3.5">
        {/* Shift & Staff Button */}
        <button
          type="button"
          onClick={() => setIsStaffModalOpen(true)}
          className={`group flex items-center space-x-3 px-1.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-sm ${
            isNight
              ? 'bg-white border-indigo-200 hover:border-indigo-300 hover:shadow-indigo-100'
              : 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-amber-100'
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

          <div className="flex items-center space-x-1.5 max-w-[200px] truncate text-slate-700 pr-1">
            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{emp1} & {emp2}</span>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors mr-1">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Date pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* Register Active status pill */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Register Active</span>
        </div>
      </div>
    </header>
  );
}
