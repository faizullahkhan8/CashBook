// API layer: seamlessly communicates via window.electronAPI when inside Electron,
// or uses persistent localStorage-based mock SQLite when running standalone in browser.

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// Mock persistent browser store for web preview
const STORAGE_KEY = 'zada_pharmacy_db_v2';
function getBrowserStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const store = JSON.parse(raw);
      if (store.settings && !store.settings.short_items_staff) {
        store.settings.short_items_staff = JSON.stringify(['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)']);
        saveBrowserStore(store);
      }
      if (store.settings && !store.settings.theme) {
        store.settings.theme = 'light';
        saveBrowserStore(store);
      }
      if (store.settings && !store.settings.short_item_pharmacies) {
        store.settings.short_item_pharmacies = JSON.stringify(['Local Pharmacy', 'Medicine Market']);
        saveBrowserStore(store);
      }
      return store;
    } catch {
      // fallback
    }
  }
  const initial = {
    settings: {
      pharmacy_name: 'ZADA PHARMACY — POS CASH COUNTER & CLOSINGS',
      register_station: 'Register 01',
      currency: 'PKR',
      active_shift_type: 'Day',
      day_employee_1: 'Muhammad Ali',
      day_employee_2: 'Usman Tariq',
      night_employee_1: 'Hamza Khan',
      night_employee_2: 'Bilal Ahmed',
      short_items_staff: JSON.stringify(['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)']),
      short_item_pharmacies: JSON.stringify(['Local Pharmacy', 'Medicine Market']),
      theme: 'light',
    },
    employees: [
      { id: 1, name: 'Muhammad Ali', assigned_shift: 'Day', role: 'Senior Cashier' },
      { id: 2, name: 'Usman Tariq', assigned_shift: 'Day', role: 'Counter Staff' },
      { id: 3, name: 'Hamza Khan', assigned_shift: 'Night', role: 'Night Pharmacist' },
      { id: 4, name: 'Bilal Ahmed', assigned_shift: 'Night', role: 'Night Cashier' },
    ],
    shifts: [
      {
        id: 1,
        shift_code: 'SHF-20260920-DAY-01',
        register_station: 'Register 01',
        cashier_name: 'Muhammad Ali & Usman Tariq',
        shift_type: 'Day',
        employee_1: 'Muhammad Ali',
        employee_2: 'Usman Tariq',
        opening_float: 0.0,
        opened_at: new Date().toISOString(),
        closed_at: null,
        status: 'OPEN',
      },
    ],
    ledger_entries: [],
    shift_closings: [],
    short_items: [],
    nextInvoiceId: 38,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveBrowserStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function recalculateBrowserClosing(store, shiftId) {
  const closing = (store.shift_closings || []).find((c) => c.shift_id === shiftId && !c.is_void);
  const shift = (store.shifts || []).find((s) => s.id === shiftId);
  if (!closing || !shift) return closing;
  const entries = (store.ledger_entries || []).filter((entry) => entry.shift_id === shiftId);
  const items = (store.short_items || []).filter((item) => item.shift_id === shiftId);
  const cash = entries.filter((entry) => entry.payment_method === 'CASH').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const online = entries.filter((entry) => entry.payment_method === 'ONLINE').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const shortDeduction = items.reduce((sum, item) => sum + (item.status === 'PENDING' ? Number(item.amount || 0) : Number(item.spent_amount || 0)), 0);
  closing.opening_float = Number(shift.opening_float || 0);
  closing.cash_sales = cash;
  closing.online_sales = online;
  closing.total_revenue = cash + online;
  closing.expected_drawer_cash = closing.opening_float + cash - shortDeduction;
  closing.variance = Number(closing.counted_cash || 0) - closing.expected_drawer_cash;
  closing.status = Math.abs(closing.variance) < 0.01 ? 'Balanced' : closing.variance < 0 ? 'Shortage' : 'Overage';
  closing.updated_at = new Date().toISOString();
  return closing;
}

export const api = {
  isElectron,

  async getActiveShift() {
    if (isElectron) return window.electronAPI.getActiveShift();
    const store = getBrowserStore();
    let active = store.shifts.find((s) => s.status === 'OPEN');
    if (!active) {
      const sType = store.settings?.active_shift_type || 'Day';
      const emp1 = sType === 'Night' ? store.settings?.night_employee_1 : store.settings?.day_employee_1;
      const emp2 = sType === 'Night' ? store.settings?.night_employee_2 : store.settings?.day_employee_2;
      active = {
        id: store.shifts.length + 1,
        shift_code: `SHF-${Date.now().toString().slice(-6)}`,
        register_station: 'Register 01',
        cashier_name: `${emp1} & ${emp2}`,
        shift_type: sType,
        employee_1: emp1,
        employee_2: emp2,
        opening_float: 0,
        opened_at: new Date().toISOString(),
        closed_at: null,
        status: 'OPEN',
      };
      store.shifts.push(active);
      saveBrowserStore(store);
    }
    return active;
  },

  async updateOpeningFloat(shiftId, amount) {
    if (isElectron) return window.electronAPI.updateOpeningFloat(shiftId, amount);
    const store = getBrowserStore();
    const shift = store.shifts.find((s) => s.id === shiftId);
    if (shift) {
      shift.opening_float = Number(amount) || 0;
      saveBrowserStore(store);
    }
    return shift;
  },

  async updateShiftStaff(data) {
    if (isElectron) return window.electronAPI.updateShiftStaff(data);
    const store = getBrowserStore();
    const active = store.shifts.find((s) => s.status === 'OPEN');
    if (active) {
      if (data.shift_type) active.shift_type = data.shift_type;
      if (data.employee_1 !== undefined) active.employee_1 = data.employee_1;
      if (data.employee_2 !== undefined) active.employee_2 = data.employee_2;
      active.cashier_name = `${active.employee_1} & ${active.employee_2}`;
      store.settings.active_shift_type = active.shift_type;

      if (data.save_as_default) {
        if (active.shift_type === 'Day') {
          store.settings.day_employee_1 = active.employee_1;
          store.settings.day_employee_2 = active.employee_2;
        } else {
          store.settings.night_employee_1 = active.employee_1;
          store.settings.night_employee_2 = active.employee_2;
        }
      }
      saveBrowserStore(store);
    }
    return active;
  },

  async getAllEmployees() {
    if (isElectron) return window.electronAPI.getAllEmployees();
    const store = getBrowserStore();
    return store.employees || [];
  },

  async saveEmployee(data) {
    if (isElectron) return window.electronAPI.saveEmployee(data);
    const store = getBrowserStore();
    if (!store.employees) store.employees = [];
    if (data.id) {
      const idx = store.employees.findIndex((e) => e.id === data.id);
      if (idx !== -1) {
        store.employees[idx] = { ...store.employees[idx], ...data };
      }
    } else {
      const newEmp = { id: Date.now(), ...data };
      store.employees.push(newEmp);
    }
    saveBrowserStore(store);
    return data;
  },

  async deleteEmployee(id) {
    if (isElectron) return window.electronAPI.deleteEmployee(id);
    const store = getBrowserStore();
    if (store.employees) {
      store.employees = store.employees.filter((e) => e.id !== id);
      saveBrowserStore(store);
    }
    return { success: true, id };
  },

  async getNextInvoiceNumber() {
    if (isElectron) return window.electronAPI.getNextInvoiceNumber();
    const store = getBrowserStore();
    const year = new Date().getFullYear();
    const num = store.nextInvoiceId || 1;
    return `INV-${year}-${String(num).padStart(4, '0')}`;
  },

  async addLedgerEntry(data) {
    if (isElectron) return window.electronAPI.addLedgerEntry(data);
    const store = getBrowserStore();
    const shift = store.shifts.find((s) => s.status === 'OPEN') || store.shifts[0];
    const year = new Date().getFullYear();
    const inv = data.invoice_number || `INV-${year}-${String(store.nextInvoiceId || 1).padStart(4, '0')}`;
    store.nextInvoiceId = (store.nextInvoiceId || 1) + 1;

    const newEntry = {
      id: Date.now(),
      shift_id: shift.id,
      shift_type: data.shift_type || shift.shift_type || 'Day',
      employee_1: data.employee_1 !== undefined ? data.employee_1 : (shift.employee_1 || ''),
      employee_2: data.employee_2 !== undefined ? data.employee_2 : (shift.employee_2 || ''),
      invoice_number: inv,
      customer_type: data.customer_type || 'Walk-in Customer',
      amount: parseFloat(data.amount) || 0,
      payment_method: data.payment_method === 'ONLINE' ? 'ONLINE' : 'CASH',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    store.ledger_entries.unshift(newEntry);
    saveBrowserStore(store);

    const summary = await this.getShiftSummary(shift.id);
    const nextInvoice = await this.getNextInvoiceNumber();

    return {
      entry: newEntry,
      nextInvoice,
      summary,
    };
  },

  async updateLedgerEntry(id, data) {
    if (isElectron) return window.electronAPI.updateLedgerEntry(id, data);
    const store = getBrowserStore();
    const entry = store.ledger_entries.find((e) => e.id === id);
    if (entry) {
      if (data.customer_type) entry.customer_type = data.customer_type;
      if (data.payment_method) entry.payment_method = data.payment_method;
      if (data.notes !== undefined) entry.notes = data.notes;
      if (data.amount !== undefined) entry.amount = parseFloat(data.amount) || 0;
      recalculateBrowserClosing(store, entry.shift_id);
      saveBrowserStore(store);
    }
    return entry;
  },

  async deleteLedgerEntry(id) {
    if (isElectron) return window.electronAPI.deleteLedgerEntry(id);
    const store = getBrowserStore();
    const entry = store.ledger_entries.find((e) => e.id === id);
    store.ledger_entries = store.ledger_entries.filter((e) => e.id !== id);
    if (entry) recalculateBrowserClosing(store, entry.shift_id);
    saveBrowserStore(store);
    return { success: true, deletedId: id };
  },

  async getRecentEntries(shiftId, limit = 50) {
    if (isElectron) return window.electronAPI.getRecentEntries(shiftId, limit);
    const store = getBrowserStore();
    const active = store.shifts.find((s) => s.status === 'OPEN') || store.shifts[0];
    const targetShiftId = shiftId || (active ? active.id : 1);
    return store.ledger_entries
      .filter((e) => e.shift_id === targetShiftId)
      .slice(0, limit);
  },

  async getAllLedgerEntries(filters = {}) {
    if (isElectron) return window.electronAPI.getAllLedgerEntries(filters);
    const store = getBrowserStore();
    let list = [...(store.ledger_entries || [])];

    if (filters.shiftId !== undefined && filters.shiftId !== null) {
      list = list.filter((entry) => entry.shift_id === Number(filters.shiftId));
    }

    if (filters.shiftType && filters.shiftType !== 'ALL') {
      list = list.filter((e) => e.shift_type === filters.shiftType);
    }
    if (filters.method && filters.method !== 'ALL') {
      list = list.filter((e) => e.payment_method === filters.method);
    }
    if (filters.customerType && filters.customerType !== 'ALL') {
      list = list.filter((e) => e.customer_type === filters.customerType);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.invoice_number?.toLowerCase().includes(s) ||
          e.notes?.toLowerCase().includes(s) ||
          e.customer_type?.toLowerCase().includes(s) ||
          e.employee_1?.toLowerCase().includes(s) ||
          e.employee_2?.toLowerCase().includes(s)
      );
    }
    // Newest first
    list.sort((a, b) => (b.id || 0) - (a.id || 0));
    return list;
  },

  async getShiftSummary(shiftId) {
    if (isElectron) return window.electronAPI.getShiftSummary(shiftId);
    const store = getBrowserStore();
    const targetShift = store.shifts.find((s) => (shiftId ? s.id === shiftId : s.status === 'OPEN')) || store.shifts[0];
    const entries = store.ledger_entries.filter((e) => e.shift_id === (targetShift ? targetShift.id : 1));

    let cashInflow = 0;
    let onlineCollections = 0;
    let cashCount = 0;
    let onlineCount = 0;

    for (const e of entries) {
      if (e.payment_method === 'CASH') {
        cashInflow += e.amount;
        cashCount++;
      } else {
        onlineCollections += e.amount;
        onlineCount++;
      }
    }

    const totalRevenue = cashInflow + onlineCollections;
    const totalCount = cashCount + onlineCount;
    const openingFloat = Number(targetShift?.opening_float) || 0;

    // Calculate Short Items for Mock
    const shortItems = store.short_items || [];
    const shiftShortItems = shortItems.filter(item => item.shift_id === targetShift.id);
    
    let pendingShortItemsCount = 0;
    let totalSpentOnShortItems = 0;
    let totalPendingAmount = 0;

    for (const item of shiftShortItems) {
      if (item.status === 'PENDING') {
        pendingShortItemsCount++;
        totalPendingAmount += (Number(item.amount) || 0);
      } else if (item.status === 'RETURNED') {
        totalSpentOnShortItems += (Number(item.spent_amount) || 0);
      }
    }

    const expectedDrawerCash = openingFloat + cashInflow - totalSpentOnShortItems - totalPendingAmount;
    const totalShortItemsDeduction = totalSpentOnShortItems + totalPendingAmount;

    const cashShare = totalRevenue > 0 ? ((cashInflow / totalRevenue) * 100).toFixed(1) : 0;
    const onlineShare = totalRevenue > 0 ? ((onlineCollections / totalRevenue) * 100).toFixed(1) : 0;

    return {
      shift: targetShift,
      totalRevenue,
      cashInflow,
      onlineCollections,
      cashCount,
      onlineCount,
      totalCount,
      openingFloat,
      expectedDrawerCash,
      cashShare,
      onlineShare,
      pendingShortItemsCount,
      totalSpentOnShortItems,
      totalPendingShortItemsAmount: totalPendingAmount,
      totalShortItemsDeduction
    };
  },

  async saveShiftClosing(data) {
    if (isElectron) return window.electronAPI.saveShiftClosing(data);
    const store = getBrowserStore();
    const closingId = 1001 + store.shift_closings.length;
    const closingCode = `CLS-${closingId}`;

    const newClosing = {
      id: closingId,
      closing_code: closingCode,
      shift_id: data.shift_id,
      shift_type: data.shift_type || 'Day',
      employee_1: data.employee_1 || '',
      employee_2: data.employee_2 || '',
      cashier_name: data.cashier_name || `${data.employee_1} & ${data.employee_2}`,
      opening_float: Number(data.opening_float) || 0,
      cash_sales: Number(data.cash_sales) || 0,
      online_sales: Number(data.online_sales) || 0,
      total_revenue: Number(data.total_revenue) || 0,
      expected_drawer_cash: Number(data.expected_drawer_cash) || 0,
      counted_cash: Number(data.counted_cash) || 0,
      variance: Number(data.variance) || 0,
      status: data.status || 'Balanced',
      denominations_json: typeof data.denominations_json === 'string' ? data.denominations_json : JSON.stringify(data.denominations_json || {}),
      audit_notes: data.audit_notes || '',
      closed_at: new Date().toISOString(),
    };

    store.shift_closings.unshift(newClosing);

    // Close active shift and start new one
    const activeShift = store.shifts.find((s) => s.id === data.shift_id);
    if (activeShift) {
      activeShift.status = 'CLOSED';
      activeShift.closed_at = new Date().toISOString();
    }

    // Maintain current shift type (shifts will only be switched manually)
    const nextType = data.next_shift_type || data.shift_type || store.settings.active_shift_type || 'Day';
    const nextEmp1 = data.next_employee_1 || (nextType === 'Night' ? store.settings.night_employee_1 : store.settings.day_employee_1);
    const nextEmp2 = data.next_employee_2 || (nextType === 'Night' ? store.settings.night_employee_2 : store.settings.day_employee_2);

    const newShift = {
      id: store.shifts.length + 1,
      shift_code: `SHF-${Date.now().toString().slice(-6)}`,
      register_station: 'Register 01',
      shift_type: nextType,
      employee_1: nextEmp1,
      employee_2: nextEmp2,
      cashier_name: `${nextEmp1} & ${nextEmp2}`,
      opening_float: data.carryOverFloatAsNewShift ? Number(data.counted_cash) : 0.0,
      opened_at: new Date().toISOString(),
      closed_at: null,
      status: 'OPEN',
    };
    store.shifts.push(newShift);
    store.settings.active_shift_type = nextType;
    saveBrowserStore(store);

    return {
      closing: newClosing,
      newShift,
    };
  },

  async getAllClosings(filters = {}) {
    if (isElectron) return window.electronAPI.getAllClosings(filters);
    const store = getBrowserStore();
    let list = store.shift_closings || [];
    if (filters?.shiftType && filters.shiftType !== 'ALL') {
      list = list.filter((c) => c.shift_type === filters.shiftType);
    }
    return list;
  },

  async getClosingById(id) {
    if (isElectron) return window.electronAPI.getClosingById(id);
    const store = getBrowserStore();
    return store.shift_closings.find((c) => c.id === id || c.closing_code === id);
  },

  async updateShiftClosing(id, data) {
    if (isElectron) return window.electronAPI.updateShiftClosing(id, data);
    const store = getBrowserStore();
    const closing = store.shift_closings.find((c) => c.id === id);
    if (!closing) throw new Error('Closing not found');
    if (closing.is_void) throw new Error('A void closing cannot be edited');
    const countedCash = Number(data.counted_cash);
    if (!Number.isFinite(countedCash) || countedCash < 0) throw new Error('Invalid counted cash');
    closing.employee_1 = String(data.employee_1 || '').trim();
    closing.employee_2 = String(data.employee_2 || '').trim();
    closing.cashier_name = `${closing.employee_1} & ${closing.employee_2}`;
    closing.counted_cash = countedCash;
    closing.denominations_json = typeof data.denominations_json === 'string' ? data.denominations_json : JSON.stringify(data.denominations_json || {});
    closing.audit_notes = String(data.audit_notes || '').trim();
    recalculateBrowserClosing(store, closing.shift_id);
    saveBrowserStore(store);
    return closing;
  },

  async voidShiftClosing(id, reason) {
    if (isElectron) return window.electronAPI.voidShiftClosing(id, reason);
    const store = getBrowserStore();
    const closing = store.shift_closings.find((c) => c.id === id);
    if (!closing) throw new Error('Closing not found');
    const cleanReason = String(reason || '').trim();
    if (!cleanReason) throw new Error('Void reason is required');
    closing.is_void = 1;
    closing.status = 'VOID';
    closing.void_reason = cleanReason;
    closing.voided_at = new Date().toISOString();
    closing.updated_at = closing.voided_at;
    saveBrowserStore(store);
    return closing;
  },

  async getSettings() {
    if (isElectron) return window.electronAPI.getSettings();
    const store = getBrowserStore();
    return store.settings;
  },

  async updateSettings(settings) {
    if (isElectron) return window.electronAPI.updateSettings(settings);
    const store = getBrowserStore();
    store.settings = { ...store.settings, ...settings };
    saveBrowserStore(store);
    return store.settings;
  },

  async printSlip() {
    // Use native window.print() which triggers the OS print dialog reliably in Electron
    setTimeout(() => window.print(), 100);
    return { success: true };
  },

  async getBackups() {
    if (isElectron) return window.electronAPI.getBackups();
    return [];
  },

  async restoreBackup(filename) {
    if (isElectron) return window.electronAPI.restoreBackup(filename);
    return { success: false, error: 'Restore not supported in web browser mock mode' };
  },

  async addShortItem(data) {
    if (isElectron) return window.electronAPI.addShortItem(data);
    const store = getBrowserStore();
    const active = store.shifts.find((s) => s.status === 'OPEN') || store.shifts[0];
    
    if (!store.short_items) store.short_items = [];
    
    const newItem = {
      id: Date.now(),
      shift_id: active.id,
      amount: parseFloat(data.amount) || 0,
      given_to: data.given_to || '',
      notes: data.notes || '',
      status: 'PENDING',
      returned_amount: 0,
      spent_amount: 0,
      bill_amount: 0,
      reference_no: '',
      pharmacy: '',
      created_at: new Date().toISOString()
    };
    
    store.short_items.unshift(newItem);
    saveBrowserStore(store);
    return newItem;
  },

  async updateShortItem(id, data) {
    if (isElectron) return window.electronAPI.updateShortItem(id, data);
    const store = getBrowserStore();
    const item = (store.short_items || []).find(i => i.id === id);
    if (!item) throw new Error('Short item not found');

    const amount = parseFloat(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
    const billAmount = Number(item.bill_amount || item.spent_amount) || 0;
    if (item.status === 'RETURNED' && amount < billAmount) {
      throw new Error('Issued amount cannot be less than bill amount');
    }

    item.amount = amount;
    item.given_to = String(data.given_to || '').trim();
    item.notes = String(data.notes || '').trim();
    item.spent_amount = item.status === 'RETURNED' ? billAmount : 0;
    item.returned_amount = item.status === 'RETURNED' ? amount - billAmount : 0;
    recalculateBrowserClosing(store, item.shift_id);
    saveBrowserStore(store);
    return item;
  },

  async deleteShortItem(id) {
    if (isElectron) return window.electronAPI.deleteShortItem(id);
    const store = getBrowserStore();
    const index = (store.short_items || []).findIndex(i => i.id === id);
    if (index === -1) throw new Error('Short item not found');
    const [deleted] = store.short_items.splice(index, 1);
    recalculateBrowserClosing(store, deleted.shift_id);
    saveBrowserStore(store);
    return { success: true };
  },

  async returnShortItem(id, data) {
    if (isElectron) return window.electronAPI.returnShortItem(id, data);
    const store = getBrowserStore();
    if (!store.short_items) return null;
    
    const item = store.short_items.find(i => i.id === id);
    if (!item) return null;
    
    const billAmount = Number(data.bill_amount);
    if (!Number.isFinite(billAmount) || billAmount < 0) throw new Error('Invalid bill amount');
    if (billAmount > Number(item.amount)) throw new Error('Bill amount cannot exceed given amount');
    const referenceNo = String(data.reference_no || '').trim();
    const pharmacy = String(data.pharmacy || '').trim();
    if (!referenceNo) throw new Error('Reference number is required');
    if (!pharmacy) throw new Error('Pharmacy name is required');
    const returnedAmount = Number(item.amount) - billAmount;
    item.status = 'RETURNED';
    item.returned_amount = returnedAmount;
    item.spent_amount = billAmount;
    item.bill_amount = billAmount;
    item.reference_no = referenceNo;
    item.pharmacy = pharmacy;
    item.returned_at = new Date().toISOString();
    recalculateBrowserClosing(store, item.shift_id);
    
    saveBrowserStore(store);
    return item;
  },

  async getShortItems(shiftId) {
    if (isElectron) return window.electronAPI.getShortItems(shiftId);
    const store = getBrowserStore();
    if (!store.short_items) return [];
    
    if (shiftId === 'ALL') {
      return [...store.short_items].sort((a, b) => b.id - a.id);
    }

    const active = store.shifts.find((s) => s.status === 'OPEN') || store.shifts[0];
    const targetShiftId = shiftId || (active ? active.id : 1);
    
    return store.short_items.filter(i => i.shift_id === targetShiftId).sort((a, b) => b.id - a.id);
  }
};
