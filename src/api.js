// API layer for Zada Pharmacy POS Cash Counter
// Communicates with Hostinger MySQL PHP API via REST + JWT tokens,
// and gracefully supports Electron native IPC when running inside desktop Electron.

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
const BASE_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('pos_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('pos_token', token);
  else localStorage.removeItem('pos_token');
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem('pos_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSavedUser(user) {
  if (user) localStorage.setItem('pos_user', JSON.stringify(user));
  else localStorage.removeItem('pos_user');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setToken(null);
    setSavedUser(null);
    window.dispatchEvent(new CustomEvent('pos:auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  isElectron,

  // --- AUTHENTICATION & USERS ---
  auth: {
    login: async (username, password) => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(res.token);
      setSavedUser(res.user);
      return res;
    },
    me: async () => {
      return request('/api/auth/me');
    },
    logout: () => {
      setToken(null);
      setSavedUser(null);
    },
    getUsers: async () => {
      return request('/api/auth/users');
    },
    createUser: async (userData) => {
      return request('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    toggleStatus: async (userId, status) => {
      return request(`/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    changePassword: async (current_password, new_password) => {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password, new_password }),
      });
    },
  },

  // --- SHIFTS ---
  async getActiveShift() {
    try {
      return await request('/api/shifts/active');
    } catch (err) {
      if (isElectron) return window.electronAPI.getActiveShift();
      throw err;
    }
  },

  async updateOpeningFloat(shiftId, amount) {
    try {
      return await request('/api/shifts/opening-float', {
        method: 'POST',
        body: JSON.stringify({ shiftId, amount }),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateOpeningFloat(shiftId, amount);
      throw err;
    }
  },

  async updateShiftStaff(data) {
    try {
      return await request('/api/shifts/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateShiftStaff(data);
      throw err;
    }
  },

  async getShiftSummary(shiftId) {
    try {
      const query = shiftId ? `?shiftId=${shiftId}` : '';
      return await request(`/api/shifts/summary${query}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getShiftSummary(shiftId);
      throw err;
    }
  },

  // --- LEDGER ENTRIES ---
  async getNextInvoiceNumber() {
    try {
      const res = await request('/api/ledger/next-invoice');
      return res.invoice_number;
    } catch (err) {
      if (isElectron) return window.electronAPI.getNextInvoiceNumber();
      return `INV-${new Date().getFullYear()}-0001`;
    }
  },

  async addLedgerEntry(data) {
    try {
      return await request('/api/ledger/entry', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.addLedgerEntry(data);
      throw err;
    }
  },

  async updateLedgerEntry(id, data) {
    try {
      return await request(`/api/ledger/entry/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateLedgerEntry(id, data);
      throw err;
    }
  },

  async deleteLedgerEntry(id) {
    try {
      return await request(`/api/ledger/entry/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.deleteLedgerEntry(id);
      throw err;
    }
  },

  async getRecentEntries(shiftId, limit = 50) {
    try {
      const query = `?limit=${limit}${shiftId ? `&shiftId=${shiftId}` : ''}`;
      return await request(`/api/ledger/recent${query}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getRecentEntries(shiftId, limit);
      return [];
    }
  },

  async getAllLedgerEntries(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.shiftId) params.append('shiftId', filters.shiftId);
      if (filters.shiftType) params.append('shiftType', filters.shiftType);
      if (filters.method) params.append('method', filters.method);
      if (filters.customerType) params.append('customerType', filters.customerType);
      if (filters.search) params.append('search', filters.search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await request(`/api/ledger/all${query}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getAllLedgerEntries(filters);
      return [];
    }
  },

  // --- SHIFT CLOSINGS ---
  async saveShiftClosing(data) {
    try {
      return await request('/api/closings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.saveShiftClosing(data);
      throw err;
    }
  },

  async getAllClosings(filters = {}) {
    try {
      const query = filters?.shiftType ? `?shiftType=${filters.shiftType}` : '';
      return await request(`/api/closings${query}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getAllClosings(filters);
      return [];
    }
  },

  async getClosingById(id) {
    try {
      return await request(`/api/closings/${id}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getClosingById(id);
      return null;
    }
  },

  async updateShiftClosing(id, data) {
    try {
      return await request(`/api/closings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateShiftClosing(id, data);
      throw err;
    }
  },

  async voidShiftClosing(id, reason) {
    try {
      return await request(`/api/closings/${id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.voidShiftClosing(id, reason);
      throw err;
    }
  },

  // --- SHORT ITEMS ---
  async getShortItems(shiftId) {
    try {
      const query = shiftId ? `?shiftId=${shiftId}` : '';
      return await request(`/api/short-items${query}`);
    } catch (err) {
      if (isElectron) return window.electronAPI.getShortItems(shiftId);
      return [];
    }
  },

  async addShortItem(data) {
    try {
      return await request('/api/short-items', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.addShortItem(data);
      throw err;
    }
  },

  async updateShortItem(id, data) {
    try {
      return await request(`/api/short-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateShortItem(id, data);
      throw err;
    }
  },

  async returnShortItem(id, data) {
    try {
      return await request(`/api/short-items/${id}/return`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.returnShortItem(id, data);
      throw err;
    }
  },

  async deleteShortItem(id) {
    try {
      return await request(`/api/short-items/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.deleteShortItem(id);
      throw err;
    }
  },

  // --- EMPLOYEES ---
  async getAllEmployees() {
    try {
      return await request('/api/employees');
    } catch (err) {
      if (isElectron) return window.electronAPI.getAllEmployees();
      return [];
    }
  },

  async saveEmployee(data) {
    try {
      return await request('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.saveEmployee(data);
      throw err;
    }
  },

  async deleteEmployee(id) {
    try {
      return await request(`/api/employees/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.deleteEmployee(id);
      throw err;
    }
  },

  // --- SETTINGS & PRINT ---
  async getSettings() {
    try {
      return await request('/api/settings');
    } catch (err) {
      if (isElectron) return window.electronAPI.getSettings();
      return {};
    }
  },

  async updateSettings(settings) {
    try {
      return await request('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch (err) {
      if (isElectron) return window.electronAPI.updateSettings(settings);
      throw err;
    }
  },

  async printSlip() {
    setTimeout(() => window.print(), 100);
    return { success: true };
  },

  async getBackups() {
    if (isElectron) return window.electronAPI.getBackups();
    return [];
  },

  async restoreBackup(filename) {
    if (isElectron) return window.electronAPI.restoreBackup(filename);
    return { success: false, error: 'Database restore is managed via Hostinger MySQL' };
  },

  async getSyncStatus() {
    if (isElectron) return window.electronAPI.getSyncStatus();
    return { enabled: true, serverOnline: true, connected: true };
  },
};
