import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('ledger');
  const [activeShift, setActiveShift] = useState(null);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    cashInflow: 0,
    onlineCollections: 0,
    cashCount: 0,
    onlineCount: 0,
    totalCount: 0,
    openingFloat: 0,
    expectedDrawerCash: 0,
    cashShare: 0,
    onlineShare: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [allClosings, setAllClosings] = useState([]);
  const [shortItems, setShortItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [nextInvoice, setNextInvoice] = useState('INV-2026-0001');
  const [settings, setSettings] = useState({
    pharmacy_name: 'ZADA PHARMACY — POS CASH COUNTER & CLOSINGS',
    register_station: 'Register 01',
    currency: 'PKR',
    active_shift_type: 'Day',
    day_employee_1: 'Muhammad Ali',
    day_employee_2: 'Usman Tariq',
    night_employee_1: 'Hamza Khan',
    night_employee_2: 'Bilal Ahmed',
  });
  const [selectedClosingForSlip, setSelectedClosingForSlip] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((curr) => (curr && curr.message === message ? null : curr));
    }, 3200);
  };

  const refreshData = useCallback(async () => {
    try {
      const shift = await api.getActiveShift();
      setActiveShift(shift);

      const [nextInv, summ, entries, closings, appSettings, empList, shortList] = await Promise.all([
        api.getNextInvoiceNumber(),
        api.getShiftSummary(shift?.id),
        api.getRecentEntries(shift?.id, 50),
        api.getAllClosings(),
        api.getSettings(),
        api.getAllEmployees(),
        api.getShortItems(shift?.id),
      ]);

      if (nextInv) setNextInvoice(nextInv);
      if (summ) setSummary(summ);
      if (entries) setRecentEntries(entries);
      if (closings) setAllClosings(closings);
      if (appSettings && Object.keys(appSettings).length > 0) {
        setSettings((prev) => ({ ...prev, ...appSettings }));
      }
      if (empList) setEmployees(empList);
      if (shortList) setShortItems(shortList);
    } catch (err) {
      console.error('Failed to load initial shift data:', err);
    }
  }, []);

  const refreshShortItems = async () => {
    if (!activeShift) return;
    const list = await api.getShortItems(activeShift.id);
    if (list) setShortItems(list);
    const summ = await api.getShiftSummary(activeShift.id);
    if (summ) setSummary(summ);
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchShift = async (targetShiftType) => {
    try {
      const sType = targetShiftType || (activeShift?.shift_type === 'Day' ? 'Night' : 'Day');
      const emp1 = sType === 'Night' ? (settings.night_employee_1 || 'Hamza Khan') : (settings.day_employee_1 || 'Muhammad Ali');
      const emp2 = sType === 'Night' ? (settings.night_employee_2 || 'Bilal Ahmed') : (settings.day_employee_2 || 'Usman Tariq');

      const updated = await api.updateShiftStaff({
        shift_type: sType,
        employee_1: emp1,
        employee_2: emp2,
      });

      if (updated) {
        setActiveShift(updated);
        setSettings((prev) => ({ ...prev, active_shift_type: sType }));
        showToast(`Active Shift switched to ${sType} Shift (${emp1} & ${emp2})`, 'info');
      }
    } catch (err) {
      console.error('Failed to switch shift:', err);
      showToast('Error switching shift: ' + err.message, 'error');
    }
  };

  const updateShiftStaff = async ({ shift_type, employee_1, employee_2, save_as_default }) => {
    try {
      const updated = await api.updateShiftStaff({
        shift_type: shift_type || activeShift?.shift_type || 'Day',
        employee_1,
        employee_2,
        save_as_default,
      });

      if (updated) {
        setActiveShift(updated);
        await refreshData();
        showToast('Shift staff updated successfully!', 'success');
        return updated;
      }
    } catch (err) {
      console.error('Failed to update shift staff:', err);
      showToast('Error updating staff: ' + err.message, 'error');
      return null;
    }
  };

  const saveStaffSetup = async (staffConfig) => {
    try {
      // staffConfig: { day_employee_1, day_employee_2, night_employee_1, night_employee_2 }
      await api.updateSettings(staffConfig);

      // Also sync current active shift employees if matching current shift type
      const currentShiftType = activeShift?.shift_type || 'Day';
      const currentEmp1 = currentShiftType === 'Night' ? staffConfig.night_employee_1 : staffConfig.day_employee_1;
      const currentEmp2 = currentShiftType === 'Night' ? staffConfig.night_employee_2 : staffConfig.day_employee_2;

      await api.updateShiftStaff({
        shift_type: currentShiftType,
        employee_1: currentEmp1,
        employee_2: currentEmp2,
      });

      await refreshData();
      showToast('Shift employees roster saved and applied!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to save staff setup:', err);
      showToast('Failed to save staff roster: ' + err.message, 'error');
      return false;
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.updateSettings(newSettings);
      await refreshData();
      showToast('Settings updated successfully', 'success');
      return res;
    } catch (err) {
      console.error('Failed to update settings:', err);
      showToast('Failed to update settings: ' + err.message, 'error');
      throw err;
    }
  };

  const addLedgerEntry = async ({ invoice_number, customer_type, amount, payment_method, notes, shift_type, employee_1, employee_2 }) => {
    try {
      const currentShiftType = shift_type || activeShift?.shift_type || 'Day';
      const currentEmp1 = employee_1 !== undefined ? employee_1 : (activeShift?.employee_1 || '');
      const currentEmp2 = employee_2 !== undefined ? employee_2 : (activeShift?.employee_2 || '');

      const result = await api.addLedgerEntry({
        shift_id: activeShift?.id,
        shift_type: currentShiftType,
        employee_1: currentEmp1,
        employee_2: currentEmp2,
        invoice_number,
        customer_type,
        amount,
        payment_method,
        notes,
      });

      if (result) {
        setNextInvoice(result.nextInvoice);
        setSummary(result.summary);
        setRecentEntries((prev) => [result.entry, ...prev]);
        showToast(`+${settings.currency} ${Number(amount).toLocaleString()} added to ${payment_method}!`, 'success');
        return true;
      }
    } catch (err) {
      console.error('Error adding ledger entry:', err);
      showToast(err.message || 'Failed to add entry', 'error');
      return false;
    }
  };

  const deleteLedgerEntry = async (id) => {
    try {
      const res = await api.deleteLedgerEntry(id);
      if (res && res.success) {
        setRecentEntries((prev) => prev.filter((e) => e.id !== id));
        const updatedSummary = await api.getShiftSummary(activeShift?.id);
        if (updatedSummary) setSummary(updatedSummary);
        showToast('Entry removed from shift ledger', 'info');
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
      showToast('Could not delete entry', 'error');
    }
  };

  const updateFloat = async (amount) => {
    try {
      if (!activeShift) return;
      const updatedShift = await api.updateOpeningFloat(activeShift.id, amount);
      if (updatedShift) {
        setActiveShift(updatedShift);
        const summ = await api.getShiftSummary(updatedShift.id);
        if (summ) setSummary(summ);
        showToast(`Opening petty cash float updated to ${settings.currency} ${Number(amount).toLocaleString()}`, 'success');
      }
    } catch (err) {
      console.error('Failed to update opening float:', err);
      showToast('Failed to update opening float', 'error');
    }
  };

  const finalizeClosing = async (closingData) => {
    try {
      const currentShiftType = closingData.shift_type || activeShift?.shift_type || 'Day';
      const currentEmp1 = closingData.employee_1 !== undefined ? closingData.employee_1 : (activeShift?.employee_1 || '');
      const currentEmp2 = closingData.employee_2 !== undefined ? closingData.employee_2 : (activeShift?.employee_2 || '');

      const result = await api.saveShiftClosing({
        ...closingData,
        shift_id: activeShift?.id,
        shift_type: currentShiftType,
        employee_1: currentEmp1,
        employee_2: currentEmp2,
      });

      if (result) {
        showToast(`Shift finalized successfully! ID: ${result.closing.closing_code}`, 'success');
        setSelectedClosingForSlip(result.closing);
        setIsSlipModalOpen(true);
        await refreshData();
        setCurrentView('all-closings');
        return result.closing;
      }
    } catch (err) {
      console.error('Failed to finalize closing:', err);
      showToast('Error saving shift closing: ' + err.message, 'error');
      return null;
    }
  };

  const openSlip = (closing) => {
    setSelectedClosingForSlip(closing);
    setIsSlipModalOpen(true);
  };

  const closeSlip = () => {
    setIsSlipModalOpen(false);
    setSelectedClosingForSlip(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        activeShift,
        summary,
        recentEntries,
        allClosings,
        shortItems,
        employees,
        nextInvoice,
        settings,
        notification,
        selectedClosingForSlip,
        isSlipModalOpen,
        isStaffModalOpen,
        setIsStaffModalOpen,
        switchShift,
        updateShiftStaff,
        saveStaffSetup,
        updateSettings,
        addLedgerEntry,
        deleteLedgerEntry,
        updateFloat,
        finalizeClosing,
        openSlip,
        closeSlip,
        refreshData,
        refreshShortItems,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
