import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  RotateCcw,
  Settings,
  Users,
  UserPlus,
  UserCheck,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Info,
  Sun,
  Moon,
  Save,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  Code2,
  Building2,
  Plus
} from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function ReportsAuditView() {
  const {
    settings,
    updateSettings,
    showToast,
    setCurrentView,
    activeShift,
    switchShift,
    saveStaffSetup,
    theme,
    setTheme,
  } = useApp();

  const [activeTab, setActiveTab] = useState('shift-roster'); // 'shift-roster' | 'short-staff' | 'backups' | 'theme'
  const [backups, setBackups] = useState([]);

  // Shift Staff Roster State
  const [dayEmp1, setDayEmp1] = useState(settings?.day_employee_1 || '');
  const [dayEmp2, setDayEmp2] = useState(settings?.day_employee_2 || '');
  const [nightEmp1, setNightEmp1] = useState(settings?.night_employee_1 || '');
  const [nightEmp2, setNightEmp2] = useState(settings?.night_employee_2 || '');
  const [isSavingRoster, setIsSavingRoster] = useState(false);

  useEffect(() => {
    if (settings) {
      setDayEmp1(settings.day_employee_1 || 'Muhammad Ali');
      setDayEmp2(settings.day_employee_2 || 'Usman Tariq');
      setNightEmp1(settings.night_employee_1 || 'Hamza Khan');
      setNightEmp2(settings.night_employee_2 || 'Bilal Ahmed');
    }
  }, [settings]);

  // Short Item Staff state
  const [newStaffName, setNewStaffName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [newPharmacyName, setNewPharmacyName] = useState('');

  useEffect(() => {
    api.getBackups?.().then(setBackups).catch(() => {});
  }, []);

  const currentShiftType = activeShift?.shift_type || 'Day';
  const isNight = currentShiftType === 'Night';
  const activeEmp1 = activeShift?.employee_1 || (isNight ? nightEmp1 : dayEmp1);
  const activeEmp2 = activeShift?.employee_2 || (isNight ? nightEmp2 : dayEmp2);

  // Parse Short Items Staff from settings
  const shortStaffList = useMemo(() => {
    const raw = settings?.short_items_staff;
    if (!raw) return ['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      const list = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) return list;
    }
    return ['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'];
  }, [settings?.short_items_staff]);

  const pharmacyList = useMemo(() => {
    const raw = settings?.short_item_pharmacies;
    if (!raw) return ['Local Pharmacy', 'Medicine Market'];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return String(raw).split(',').map((value) => value.trim()).filter(Boolean);
    }
  }, [settings?.short_item_pharmacies]);

  const handleSaveShiftRoster = async (e) => {
    e.preventDefault();
    if (!dayEmp1.trim() || !dayEmp2.trim() || !nightEmp1.trim() || !nightEmp2.trim()) {
      showToast('Please configure all 4 staff members (2 for Day and 2 for Night)', 'error');
      return;
    }

    setIsSavingRoster(true);
    try {
      await saveStaffSetup({
        day_employee_1: dayEmp1.trim(),
        day_employee_2: dayEmp2.trim(),
        night_employee_1: nightEmp1.trim(),
        night_employee_2: nightEmp2.trim(),
      });
    } finally {
      setIsSavingRoster(false);
    }
  };

  const handleShiftSwitch = async (type) => {
    if (type !== currentShiftType) {
      await switchShift(type);
    }
  };

  const handleAddShortStaff = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newStaffName.trim();
    if (!trimmed) return;
    if (shortStaffList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('A staff member with this name already exists', 'error');
      return;
    }

    const updated = [...shortStaffList, trimmed];
    try {
      await updateSettings({ short_items_staff: JSON.stringify(updated) });
      setNewStaffName('');
      showToast(`Added "${trimmed}" to Short Items Staff!`, 'success');
    } catch (err) {
      showToast('Failed to add staff: ' + err.message, 'error');
    }
  };

  const handleDeleteShortStaff = async (nameToDelete) => {
    if (!window.confirm(`Are you sure you want to remove "${nameToDelete}" from the Short Items Staff list?`)) {
      return;
    }
    const updated = shortStaffList.filter((s) => s !== nameToDelete);
    try {
      await updateSettings({ short_items_staff: JSON.stringify(updated) });
      showToast(`Removed "${nameToDelete}" from Short Items Staff`, 'info');
    } catch (err) {
      showToast('Failed to delete staff: ' + err.message, 'error');
    }
  };

  const handleStartEditShortStaff = (idx, currentVal) => {
    setEditingIndex(idx);
    setEditingValue(currentVal);
  };

  const handleCancelEditShortStaff = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSaveEditShortStaff = async (idx) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      handleCancelEditShortStaff();
      return;
    }
    const oldName = shortStaffList[idx];
    if (
      trimmed.toLowerCase() !== oldName.toLowerCase() &&
      shortStaffList.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      showToast('Another staff member with this name already exists', 'error');
      return;
    }

    const updated = [...shortStaffList];
    updated[idx] = trimmed;
    try {
      await updateSettings({ short_items_staff: JSON.stringify(updated) });
      setEditingIndex(null);
      setEditingValue('');
      showToast(`Staff updated to "${trimmed}"`, 'success');
    } catch (err) {
      showToast('Failed to update staff: ' + err.message, 'error');
    }
  };

  const handleResetShortStaffDefaults = async () => {
    if (!window.confirm('Reset Short Items Staff list to default recommendations?')) return;
    const defaults = ['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'];
    try {
      await updateSettings({ short_items_staff: JSON.stringify(defaults) });
      showToast('Reset Short Items Staff to defaults', 'success');
    } catch (err) {
      showToast('Failed to reset defaults: ' + err.message, 'error');
    }
  };

  const handleAddPharmacy = async (e) => {
    e.preventDefault();
    const name = newPharmacyName.trim();
    if (!name) return;
    if (pharmacyList.some((item) => item.toLowerCase() === name.toLowerCase())) {
      showToast('This pharmacy already exists', 'error');
      return;
    }
    await updateSettings({ short_item_pharmacies: JSON.stringify([...pharmacyList, name]) });
    setNewPharmacyName('');
    showToast(`Added "${name}" to pharmacy dropdown`, 'success');
  };

  const handleDeletePharmacy = async (name) => {
    if (!window.confirm(`Remove "${name}" from the Short Item pharmacy dropdown?`)) return;
    await updateSettings({ short_item_pharmacies: JSON.stringify(pharmacyList.filter((item) => item !== name)) });
    showToast(`Removed "${name}" from pharmacy dropdown`, 'info');
  };

  const handleRestore = async (filename) => {
    if (
      !window.confirm(
        `CRITICAL WARNING: Are you sure you want to restore the backup "${filename}"?\n\nThis will completely overwrite your current database. Any transactions made since this backup will be permanently lost.`
      )
    )
      return;

    try {
      const res = await api.restoreBackup(filename);
      if (res.success) {
        alert('Database restored successfully! The application will now reload to apply the restored data.');
        window.location.reload();
      } else {
        alert('Failed to restore backup: ' + res.error);
      }
    } catch (e) {
      alert('An error occurred during restore: ' + e.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#27325b]/10 text-[#27325b] flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-[#27325b]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">System Settings & Staff Setup</h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure counter shift roster, short item personnel, and automated backups.
            </p>
          </div>
        </div>

        {/* Quick Link to Ledger */}
        <button
          type="button"
          onClick={() => setCurrentView('ledger')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#27325b]/10 hover:bg-[#27325b]/20 text-[#27325b] text-xs font-bold rounded-xl border border-[#27325b]/20 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Back to Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {/* Tab 1: Shift Staff Roster */}
        <button
          type="button"
          onClick={() => setActiveTab('shift-roster')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'shift-roster'
              ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Shift Staff Roster</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'shift-roster' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            4 Cashiers
          </span>
        </button>

        {/* Tab 2: Manage Short Item Staff */}
        <button
          type="button"
          onClick={() => setActiveTab('short-staff')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'short-staff'
              ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Short Items Staff</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'short-staff' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {shortStaffList.length}
          </span>
        </button>

        {/* Tab 3: Database Backups */}
        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'backups'
              ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'backups' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {backups.length}
          </span>
        </button>

        {/* Tab 4: Appearance & Theme */}
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'theme'
              ? 'bg-[#27325b] text-white shadow-md shadow-[#27325b]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span>Appearance & Theme</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
              activeTab === 'theme' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>

      {/* TAB 1: SHIFT STAFF ROSTER SETUP */}
      {activeTab === 'shift-roster' && (
        <div className="space-y-6">
          {/* Active Shift Switcher & On-Duty Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-[#27325b]" />
                  <span>Active Counter Shift & On-Duty Staff</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Switch the active counter shift or review cashiers currently logged on duty.
                </p>
              </div>

              <span className={`self-start sm:self-auto text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                isNight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isNight ? '🌙 Night Shift Active' : '☀️ Day Shift Active'}
              </span>
            </div>

            {/* Quick Switch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleShiftSwitch('Day')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-start transition-all relative overflow-hidden text-left ${
                  !isNight
                    ? 'border-amber-400 bg-amber-50/70 text-amber-950 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    !isNight ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  {!isNight && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Active Now
                    </span>
                  )}
                </div>
                <div className="font-black text-sm">Day Shift (8:00 AM – 8:00 PM)</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Assigned: <strong className="text-slate-700">{dayEmp1}</strong> & <strong className="text-slate-700">{dayEmp2}</strong>
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
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isNight ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Moon className="w-5 h-5" />
                  </div>
                  {isNight && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                      Active Now
                    </span>
                  )}
                </div>
                <div className="font-black text-sm">Night Shift (8:00 PM – 8:00 AM)</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Assigned: <strong className="text-slate-700">{nightEmp1}</strong> & <strong className="text-slate-700">{nightEmp2}</strong>
                </div>
              </button>
            </div>
          </div>

          {/* Master Roster Setup Form */}
          <form onSubmit={handleSaveShiftRoster} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Day Shift Staff Setup Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Day Shift Cashiers Setup</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Day Roster
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Primary Cashier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={dayEmp1}
                      onChange={(e) => setDayEmp1(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 bg-slate-50/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Assistant Cashier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={dayEmp2}
                      onChange={(e) => setDayEmp2(e.target.value)}
                      placeholder="e.g. Usman Tariq"
                      className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Night Shift Staff Setup Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Night Shift Cashiers Setup</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Night Roster
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Primary Cashier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nightEmp1}
                      onChange={(e) => setNightEmp1(e.target.value)}
                      placeholder="e.g. Hamza Khan"
                      className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Assistant Cashier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nightEmp2}
                      onChange={(e) => setNightEmp2(e.target.value)}
                      placeholder="e.g. Bilal Ahmed"
                      className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Changes saved here will automatically apply to sales records and shift closings.
              </span>

              <button
                type="submit"
                disabled={isSavingRoster}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingRoster ? 'Saving Roster...' : 'Save Shift Staff Roster'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE SHORT ITEM STAFF */}
      {activeTab === 'short-staff' && (
        <div className="space-y-6">
          {/* Information & Context Alert */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/70 rounded-2xl p-4.5 flex items-start space-x-3.5 shadow-sm">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-blue-900 leading-relaxed space-y-1">
              <p className="font-bold text-sm text-blue-950">
                Short Items Staff vs Counter Shift Staff
              </p>
              <p className="text-blue-800">
                Counter shift cashiers operate the register, whereas <strong>Short Item Staff</strong> are the runners, riders, or purchase assistants given cash from the counter drawer to purchase out-of-stock items.
              </p>
              <p className="text-blue-800 font-medium">
                The personnel you enter below will immediately appear in the <strong>"Given To"</strong> dropdown on the <strong>Short Items</strong> screen.
              </p>
            </div>
          </div>

          {/* Add New Staff Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Add Short Item Staff Member</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Press Enter or click Add</span>
            </div>

            <form onSubmit={handleAddShortStaff} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Enter staff name (e.g. Tariq / Rider, Kamran Boy, etc.)..."
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={!newStaffName.trim()}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
            </form>
          </div>

          {/* Current Staff List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#27325b]" />
                <h3 className="text-sm font-black text-slate-800">
                  Registered Staff Roster ({shortStaffList.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleResetShortStaffDefaults}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:underline flex items-center space-x-1"
                title="Reset to recommended sample names"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {shortStaffList.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No Short Item Staff Members Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add staff members above to populate the Short Items dropdown.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetShortStaffDefaults}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Load Sample Staff
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {shortStaffList.map((staff, idx) => {
                  const isEditing = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all shadow-sm flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-[#27325b]/10 text-[#27325b] font-black text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditShortStaff(idx);
                              if (e.key === 'Escape') handleCancelEditShortStaff();
                            }}
                            autoFocus
                            className="w-full h-8 px-2 rounded-lg border-2 border-indigo-500 text-xs font-bold text-slate-800 bg-white focus:outline-none"
                          />
                        ) : (
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-slate-800 truncate block">
                              {staff}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                              Active in Dropdown
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditShortStaff(idx)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="Save changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditShortStaff}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditShortStaff(idx, staff)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteShortStaff(staff)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete staff"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Short Item Pharmacy Dropdown Management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Purchase Pharmacies ({pharmacyList.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Used in Short Item Return form</span>
            </div>

            <form onSubmit={handleAddPharmacy} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newPharmacyName}
                onChange={(e) => setNewPharmacyName(e.target.value)}
                placeholder="Enter pharmacy name..."
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              <button type="submit" disabled={!newPharmacyName.trim()} className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Pharmacy
              </button>
            </form>

            {pharmacyList.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-slate-400">No pharmacies configured. Add one above to enable the Return dropdown.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pharmacyList.map((pharmacy, index) => (
                  <div key={pharmacy} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">{index + 1}</div>
                      <div className="min-w-0"><span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate block">{pharmacy}</span><span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active in Dropdown</span></div>
                    </div>
                    <button type="button" onClick={() => handleDeletePharmacy(pharmacy)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Remove pharmacy"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE BACKUPS */}
      {activeTab === 'backups' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">
                System Database Backups (Auto-generated on Shift Closing)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Available: {backups.length} Backup(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">BACKUP FILENAME</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">FILE SIZE</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 font-sans">
                      No automated backups found. Close a shift to trigger an automated database backup snapshot.
                    </td>
                  </tr>
                ) : (
                  backups.map((b) => (
                    <tr key={b.filename} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-700">{b.filename}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(b.time).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {(b.size / 1024).toFixed(2)} KB
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRestore(b.filename)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold font-sans flex items-center space-x-1 mx-auto transition-colors shadow-sm active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Snapshot</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: APPEARANCE & THEME SETTINGS */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#27325b] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    Display Appearance & Color Theme
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose your preferred visual theme for the CashBook interface. Your selection is permanently saved to system settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Light Theme Card */}
              <div
                onClick={() => setTheme('light')}
                className={`relative group cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 ${
                  theme !== 'dark'
                    ? 'border-[#27325b] bg-indigo-50/30 shadow-md ring-4 ring-[#27325b]/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                }`}
              >
                {/* Active Indicator Badge */}
                {theme !== 'dark' && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#27325b] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Active Theme</span>
                  </div>
                )}

                {/* Preview Mockup */}
                <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 p-2.5 mb-4 flex flex-col justify-between overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="h-2 w-16 bg-slate-300 rounded-full" />
                  </div>
                  <div className="flex gap-2 flex-1 pt-2">
                    <div className="w-1/4 bg-[#27325b] rounded-lg p-1 flex flex-col gap-1">
                      <div className="h-1.5 bg-white/40 rounded" />
                      <div className="h-1.5 bg-white/20 rounded" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col justify-between shadow-xs">
                      <div className="h-2 bg-slate-200 rounded w-3/4" />
                      <div className="flex gap-1">
                        <div className="h-3 flex-1 bg-emerald-100 rounded" />
                        <div className="h-3 flex-1 bg-indigo-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                      <span>Light Theme</span>
                      <span className="text-[10px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">Day Clean</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Clean white surfaces with high-contrast slate text and deep navy accents. Recommended for daytime office hours and bright environments.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Appearance Mode</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('light');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      theme !== 'dark'
                        ? 'bg-[#27325b] text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {theme !== 'dark' ? 'Selected' : 'Use Light Mode'}
                  </button>
                </div>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => setTheme('dark')}
                className={`relative group cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-md ring-4 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                }`}
              >
                {/* Active Indicator Badge */}
                {theme === 'dark' && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Active Theme</span>
                  </div>
                )}

                {/* Preview Mockup */}
                <div className="w-full h-28 rounded-xl bg-slate-900 border border-slate-800 p-2.5 mb-4 flex flex-col justify-between overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="h-2 w-16 bg-slate-700 rounded-full" />
                  </div>
                  <div className="flex gap-2 flex-1 pt-2">
                    <div className="w-1/4 bg-slate-800 border border-slate-700 rounded-lg p-1 flex flex-col gap-1">
                      <div className="h-1.5 bg-indigo-400/50 rounded" />
                      <div className="h-1.5 bg-slate-600 rounded" />
                    </div>
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-1.5 flex flex-col justify-between">
                      <div className="h-2 bg-slate-600 rounded w-3/4" />
                      <div className="flex gap-1">
                        <div className="h-3 flex-1 bg-emerald-950/80 border border-emerald-800/50 rounded" />
                        <div className="h-3 flex-1 bg-indigo-950/80 border border-indigo-800/50 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-900/30 text-indigo-400 mt-0.5 border border-indigo-800/40">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                      <span>Dark Theme</span>
                      <span className="text-[10px] text-indigo-400 font-bold px-1.5 py-0.5 bg-indigo-950/50 rounded border border-indigo-800/60">Night Sleek</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sleek slate and charcoal surfaces designed to reduce glare and visual fatigue during late evening and night shifts.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Appearance Mode</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('dark');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {theme === 'dark' ? 'Selected' : 'Use Dark Mode'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-[#27325b] mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">
                  Persistent Configuration Across Restarts & Views
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Your theme setting is stored securely in SQLite <code className="px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-800 text-[10px] font-mono">settings.theme</code>. You can also quickly toggle between light and dark modes at any moment using the Sun/Moon icon in the top header bar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Info & Developer Credits */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#27325b] to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Zada Pharmacy POS — Cash Counter & Shift Closings Console
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Designed & Developed by <strong className="text-slate-700 dark:text-slate-200 font-bold">Zada IT Team (Humayun Khan & Faizullah)</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <span>Version 1.0.0</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400">Production Release</span>
        </div>
      </div>
    </div>
  );
}
