const { app, BrowserWindow, ipcMain } = require('electron');
try { require('dotenv').config(); } catch (e) {}
const path = require('path');
const fs = require('fs');
const db = require('./db.cjs');
const sync = require('./sync.cjs');
const EVENTS = require('../shared/event-names.js');

const debugLogPath = path.join(__dirname, '../debug_electron.log');
function logDebug(msg) {
  try {
    fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

logDebug('main.cjs loaded, process.argv: ' + JSON.stringify(process.argv));

let mainWindow;

function publishChange(eventType, entity, shiftId) {
  try {
    const active = db.getActiveShift();
    sync.enqueue(eventType, {
      entity,
      shift: active,
      summary: active ? db.getShiftSummary(active.id) : undefined,
    });
  } catch (error) {
    logDebug(`CEO sync enqueue failed: ${error.message}`);
  }
}

function publishDashboard() {
  const active = db.getActiveShift();
  if (active) sync.enqueue(EVENTS.DASHBOARD_UPDATED, { shift: active, summary: db.getShiftSummary(active.id) });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Quick Ledger Entry POS Console - Zada Pharmacy',
    autoHideMenuBar: true,
    backgroundColor: '#0a1226',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devServerUrl).catch(() => {
      setTimeout(() => mainWindow.loadURL(devServerUrl), 1000);
    });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devServerUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  logDebug('app.whenReady fired');
  const dataDir = app.getPath('userData');
  logDebug('userData path: ' + dataDir);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logDebug('Created dataDir successfully');
  }

  try {
    await db.initDb(dataDir);
    logDebug('db.initDb succeeded');
  } catch (err) {
    logDebug('db.initDb FAILED: ' + err.message + '\n' + err.stack);
    console.error('Fatal DB Error:', err);
  }

  const syncConfig = sync.configure({
    baseUrl: process.env.CEO_SERVER_URL || 'https://cashbook-e9h7.onrender.com',
    dataDir,
    pharmacyId: process.env.CEO_PHARMACY_ID || 'zada-pharmacy',
    branchId: process.env.CEO_BRANCH_ID || 'main',
  });
  logDebug('CEO sync configured: ' + JSON.stringify(syncConfig));
  if (syncConfig.enabled) {
    const active = db.getActiveShift();
    sync.bootstrap({
      ledgers: db.getAllLedgerEntries({}),
      shortItems: db.getShortItems('ALL'),
      closings: db.getAllClosings({}),
      shift: active,
      summary: active ? db.getShiftSummary(active.id) : {},
    }).catch((error) => logDebug('CEO initial sync deferred: ' + error.message));
  }

  // Register IPC handlers
  ipcMain.handle('get-active-shift', () => {
    logDebug('IPC get-active-shift');
    return db.getActiveShift();
  });

  ipcMain.handle('update-opening-float', (_, { shiftId, amount }) => {
    logDebug(`IPC update-opening-float: shiftId=${shiftId}, amount=${amount}`);
    const result = db.updateOpeningFloat(shiftId, amount);
    publishDashboard();
    return result;
  });

  ipcMain.handle('get-next-invoice', () => {
    logDebug('IPC get-next-invoice');
    return db.getNextInvoiceNumber();
  });

  ipcMain.handle('add-ledger-entry', (_, data) => {
    logDebug('IPC add-ledger-entry: ' + JSON.stringify(data));
    try {
      const res = db.addLedgerEntry(data);
      publishChange(EVENTS.LEDGER_CREATED, res.entry, res.entry.shift_id);
      logDebug('IPC add-ledger-entry SUCCESS: ' + JSON.stringify(res));
      return res;
    } catch (err) {
      logDebug('IPC add-ledger-entry ERROR: ' + err.message + '\n' + err.stack);
      throw err;
    }
  });

  ipcMain.handle('delete-ledger-entry', (_, id) => {
    logDebug('IPC delete-ledger-entry: ' + id);
    const result = db.deleteLedgerEntry(id);
    if (result) publishChange(EVENTS.LEDGER_DELETED, result.entity, result.shift_id);
    return result;
  });

  ipcMain.handle('update-ledger-entry', (_, { id, data }) => {
    logDebug('IPC update-ledger-entry: ' + id);
    const result = db.updateLedgerEntry(id, data);
    if (result) publishChange(EVENTS.LEDGER_UPDATED, result, result.shift_id);
    return result;
  });

  ipcMain.handle('get-recent-entries', (_, { shiftId, limit }) => {
    logDebug(`IPC get-recent-entries: shiftId=${shiftId}, limit=${limit}`);
    return db.getRecentEntries(shiftId, limit);
  });

  ipcMain.handle('get-all-ledger-entries', (_, filters) => {
    logDebug('IPC get-all-ledger-entries: ' + JSON.stringify(filters));
    return db.getAllLedgerEntries(filters);
  });

  ipcMain.handle('get-shift-summary', (_, shiftId) => {
    logDebug('IPC get-shift-summary: ' + shiftId);
    return db.getShiftSummary(shiftId);
  });

  ipcMain.handle('save-shift-closing', (_, data) => {
    logDebug('IPC save-shift-closing: ' + JSON.stringify(data));
    try {
      const res = db.saveShiftClosing(data);
      publishChange(EVENTS.CLOSING_CREATED, res.closing, res.closing.shift_id);
      publishDashboard();
      logDebug('IPC save-shift-closing SUCCESS: ' + JSON.stringify(res));
      return res;
    } catch (err) {
      logDebug('IPC save-shift-closing ERROR: ' + err.message + '\n' + err.stack);
      throw err;
    }
  });

  ipcMain.handle('update-shift-staff', (_, data) => {
    logDebug('IPC update-shift-staff: ' + JSON.stringify(data));
    const result = db.updateActiveShiftStaff(data);
    publishDashboard();
    return result;
  });

  ipcMain.handle('get-all-employees', () => {
    logDebug('IPC get-all-employees');
    return db.getAllEmployees();
  });

  ipcMain.handle('save-employee', (_, data) => {
    logDebug('IPC save-employee: ' + JSON.stringify(data));
    return db.saveEmployee(data);
  });

  ipcMain.handle('delete-employee', (_, id) => {
    logDebug('IPC delete-employee: ' + id);
    return db.deleteEmployee(id);
  });

  ipcMain.handle('get-all-closings', (_, filters) => {
    logDebug('IPC get-all-closings: ' + JSON.stringify(filters));
    return db.getAllClosings(filters);
  });

  ipcMain.handle('add-short-item', (_, data) => {
    logDebug('IPC add-short-item: ' + JSON.stringify(data));
    const result = db.addShortItem(data);
    publishChange(EVENTS.SHORT_ITEM_CREATED, result, result.shift_id);
    return result;
  });

  ipcMain.handle('update-short-item', (_, { id, data }) => {
    logDebug('IPC update-short-item: ' + id);
    const result = db.updateShortItem(id, data);
    publishChange(EVENTS.SHORT_ITEM_UPDATED, result, result.shift_id);
    return result;
  });

  ipcMain.handle('delete-short-item', (_, id) => {
    logDebug('IPC delete-short-item: ' + id);
    const result = db.deleteShortItem(id);
    publishChange(EVENTS.SHORT_ITEM_DELETED, result.entity, result.shift_id);
    return result;
  });

  ipcMain.handle('return-short-item', (_, { id, data }) => {
    logDebug('IPC return-short-item: ' + id);
    const result = db.returnShortItem(id, data);
    publishChange(EVENTS.SHORT_ITEM_UPDATED, result, result.shift_id);
    return result;
  });

  ipcMain.handle('get-short-items', (_, shiftId) => {
    logDebug('IPC get-short-items: ' + shiftId);
    return db.getShortItems(shiftId);
  });

  ipcMain.handle('get-closing-by-id', (_, id) => db.getClosingById(id));
  ipcMain.handle('update-shift-closing', (_, { id, data }) => {
    const result = db.updateShiftClosing(id, data);
    publishChange(EVENTS.CLOSING_UPDATED, result, result.shift_id);
    return result;
  });
  ipcMain.handle('void-shift-closing', (_, { id, reason }) => {
    const result = db.voidShiftClosing(id, reason);
    publishChange(EVENTS.CLOSING_VOIDED, result, result.shift_id);
    return result;
  });
  ipcMain.handle('get-sync-status', () => sync.status());
  ipcMain.handle('get-settings', () => db.getSettings());
  ipcMain.handle('update-settings', (_, settings) => db.updateSettings(settings));
  ipcMain.handle('print-slip', async () => {
    if (mainWindow) {
      mainWindow.webContents.print({ silent: false, printBackground: true });
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('get-backups', () => db.getBackupsList());
  ipcMain.handle('restore-backup', (_, filename) => db.restoreBackup(filename));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
