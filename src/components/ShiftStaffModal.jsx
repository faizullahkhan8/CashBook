import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Sun, 
  Moon, 
  X, 
  UserCheck, 
  ArrowRight,
  Settings
} from 'lucide-react';

export default function ShiftStaffModal({ isOpen, onClose }) {
  const { 
    activeShift, 
    settings, 
    switchShift,
    setCurrentView
  } = useApp();

  if (!isOpen) return null;

  const currentShiftType = activeShift?.shift_type || 'Day';
  const isNight = currentShiftType === 'Night';
  
  const dayEmp1 = settings?.day_employee_1 || 'Muhammad Ali';
  const dayEmp2 = settings?.day_employee_2 || 'Usman Tariq';
  const nightEmp1 = settings?.night_employee_1 || 'Hamza Khan';
  const nightEmp2 = settings?.night_employee_2 || 'Bilal Ahmed';

  const activeEmp1 = activeShift?.employee_1 || (isNight ? nightEmp1 : dayEmp1);
  const activeEmp2 = activeShift?.employee_2 || (isNight ? nightEmp2 : dayEmp2);

  const handleShiftSwitch = async (type) => {
    if (type !== currentShiftType) {
      await switchShift(type);
    }
  };

  const handleOpenSettings = () => {
    onClose();
    setCurrentView('settings');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col scale-100">
        
        {/* Header with Shift Color Accent */}
        <div className={`h-1.5 w-full ${isNight ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
        <div className="px-6 py-5 bg-white flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isNight ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight text-slate-800 leading-tight">
                Active Counter Shift
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Switch counter operating shift & view on-duty staff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-slate-50/50 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Active Shift
              </label>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isNight ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Current: {currentShiftType} Shift
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleShiftSwitch('Day')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-start transition-all relative overflow-hidden text-left ${
                  !isNight
                    ? 'border-amber-400 bg-amber-50/70 text-amber-950 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {!isNight && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-bl-full blur-xl"></div>}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  !isNight ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div className="font-black text-sm">Day Shift</div>
                <div className="text-[11px] font-semibold mt-1">
                  {!isNight ? (
                    <span className="text-amber-700 flex items-center space-x-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                      <span>Active Now</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Click to switch</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleShiftSwitch('Night')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-start transition-all relative overflow-hidden text-left ${
                  isNight
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {isNight && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full blur-xl"></div>}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  isNight ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div className="font-black text-sm">Night Shift</div>
                <div className="text-[11px] font-semibold mt-1">
                  {isNight ? (
                    <span className="text-indigo-700 flex items-center space-x-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                      <span>Active Now</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Click to switch</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* On-Duty Assigned Staff */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                <UserCheck className={`w-4 h-4 ${isNight ? 'text-indigo-500' : 'text-amber-500'}`} />
                <span>On-Duty Staff ({currentShiftType})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Logged on Register 01</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm shadow-sm ${
                  isNight ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {activeEmp1 ? activeEmp1.charAt(0) : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Cashier</div>
                  <div className="text-sm font-bold text-slate-800 truncate">{activeEmp1 || 'Unassigned'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm shadow-sm ${
                  isNight ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'
                }`}>
                  {activeEmp2 ? activeEmp2.charAt(0) : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assistant Cashier</div>
                  <div className="text-sm font-bold text-slate-800 truncate">{activeEmp2 || 'Unassigned'}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-slate-400 text-[11px]">Need to change assigned names?</span>
              <button
                type="button"
                onClick={handleOpenSettings}
                className="font-bold text-[#27325b] hover:text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <Settings className="w-3.5 h-3.5 text-[#27325b]" />
                <span>Configure Staff Roster in Settings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-slate-900/20 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
