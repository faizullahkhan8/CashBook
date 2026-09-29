const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let SQL = null;
let db = null;
let dbFilePath = null;
let isInitialized = false;

async function initDb(dataDir) {
  const targetDir = dataDir || __dirname;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  dbFilePath = path.join(targetDir, 'cashbook.sqlite');
  console.log('[DB] Initializing SQLite database at:', dbFilePath);

  if (!SQL) {
    let wasmBinary = null;
    const possibleWasmPaths = [
      path.join(__dirname, 'sql-wasm.wasm'),
      path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm'),
      path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
      process.resourcesPath ? path.join(process.resourcesPath, 'sql-wasm.wasm') : null,
    ].filter(Boolean);

    for (const p of possibleWasmPaths) {
      if (fs.existsSync(p)) {
        try {
          wasmBinary = fs.readFileSync(p);
          console.log('[DB] Found WASM binary at:', p, `(${wasmBinary.length} bytes)`);
          break;
        } catch (e) {
          console.warn('[DB] Failed to read wasm at', p, e.message);
        }
      }
    }

    if (wasmBinary) {
      SQL = await initSqlJs({ wasmBinary });
    } else {
      SQL = await initSqlJs();
    }
  }

  let fileBuffer = null;
  if (fs.existsSync(dbFilePath)) {
    try {
      fileBuffer = fs.readFileSync(dbFilePath);
      console.log(`[DB] Loaded existing SQLite file (${fileBuffer.length} bytes)`);
    } catch (e) {
      console.warn('[DB] Could not read existing SQLite file, creating new:', e.message);
    }
  }

  db = new SQL.Database(fileBuffer);
  isInitialized = true;

  createTables();
  migrateTables();
  seedInitialData();
  ensureActiveShift();
  saveToDisk();

  console.log('[DB] SQLite database fully initialized and ready.');
  return db;
}

function saveToDisk() {
  if (!db || !dbFilePath) return;
  try {
    const data = Buffer.from(db.export());
    fs.writeFileSync(dbFilePath, data);
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

function queryOne(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function queryAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params || []);
  const res = queryOne('SELECT last_insert_rowid() as id');
  saveToDisk();
  return { lastInsertRowid: res ? res.id : null };
}

function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      assigned_shift TEXT DEFAULT 'Day',
      role TEXT DEFAULT 'Counter Staff'
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_code TEXT UNIQUE,
      register_station TEXT DEFAULT 'Register 01',
      shift_type TEXT DEFAULT 'Day',
      employee_1 TEXT,
      employee_2 TEXT,
      cashier_name TEXT DEFAULT 'Cashier 01',
      opening_float REAL DEFAULT 0.0,
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      status TEXT DEFAULT 'OPEN'
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_type TEXT DEFAULT 'Walk-in Customer',
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      shift_type TEXT DEFAULT 'Day',
      employee_1 TEXT,
      employee_2 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shift_closings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closing_code TEXT UNIQUE,
      shift_id INTEGER NOT NULL,
      shift_type TEXT DEFAULT 'Day',
      employee_1 TEXT,
      employee_2 TEXT,
      cashier_name TEXT,
      opening_float REAL NOT NULL,
      cash_sales REAL NOT NULL,
      online_sales REAL NOT NULL,
      total_revenue REAL NOT NULL,
      expected_drawer_cash REAL NOT NULL,
      counted_cash REAL NOT NULL,
      variance REAL NOT NULL,
      status TEXT NOT NULL,
      denominations_json TEXT NOT NULL,
      audit_notes TEXT,
      is_void INTEGER DEFAULT 0,
      void_reason TEXT,
      voided_at DATETIME,
      updated_at DATETIME,
      closed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS short_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      given_to TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      returned_amount REAL DEFAULT 0.0,
      spent_amount REAL DEFAULT 0.0,
      bill_amount REAL DEFAULT 0.0,
      reference_no TEXT,
      pharmacy TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      returned_at DATETIME
    );
  `;

  db.run(schema);
}

function migrateTables() {
  // Ensure shifts table has shift_type, employee_1, employee_2
  try { db.run("ALTER TABLE shifts ADD COLUMN shift_type TEXT DEFAULT 'Day'"); } catch (e) {}
  try { db.run("ALTER TABLE shifts ADD COLUMN employee_1 TEXT DEFAULT 'Muhammad Ali'"); } catch (e) {}
  try { db.run("ALTER TABLE shifts ADD COLUMN employee_2 TEXT DEFAULT 'Usman Tariq'"); } catch (e) {}

  // Ensure ledger_entries has shift_type, employee_1, employee_2
  try { db.run("ALTER TABLE ledger_entries ADD COLUMN shift_type TEXT DEFAULT 'Day'"); } catch (e) {}
  try { db.run("ALTER TABLE ledger_entries ADD COLUMN employee_1 TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE ledger_entries ADD COLUMN employee_2 TEXT"); } catch (e) {}
  try { db.run("UPDATE ledger_entries SET payment_method = 'CARD' WHERE payment_method = 'ONLINE'"); } catch (e) {}

  // Ensure shift_closings has shift_type, employee_1, employee_2
  try { db.run("ALTER TABLE shift_closings ADD COLUMN shift_type TEXT DEFAULT 'Day'"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN employee_1 TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN employee_2 TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN is_void INTEGER DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN void_reason TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN voided_at DATETIME"); } catch (e) {}
  try { db.run("ALTER TABLE shift_closings ADD COLUMN updated_at DATETIME"); } catch (e) {}

  // Ensure short_items table exists (if migration missed)
  try {
    db.run(`CREATE TABLE IF NOT EXISTS short_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      given_to TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      returned_amount REAL DEFAULT 0.0,
      spent_amount REAL DEFAULT 0.0,
      bill_amount REAL DEFAULT 0.0,
      reference_no TEXT,
      pharmacy TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      returned_at DATETIME
    )`);
  } catch(e) {}
  try { db.run("ALTER TABLE short_items ADD COLUMN bill_amount REAL DEFAULT 0.0"); } catch (e) {}
  try { db.run("ALTER TABLE short_items ADD COLUMN reference_no TEXT"); } catch (e) {}
  try { db.run("ALTER TABLE short_items ADD COLUMN pharmacy TEXT"); } catch (e) {}
}

function seedInitialData() {
  // Default settings
  const existingSetting = queryOne("SELECT value FROM settings WHERE key = 'pharmacy_name'");
  if (!existingSetting) {
    db.run("INSERT INTO settings (key, value) VALUES ('pharmacy_name', 'ZADA PHARMACY — POS CASH COUNTER & CLOSINGS')");
    db.run("INSERT INTO settings (key, value) VALUES ('register_station', 'Register 01')");
    db.run("INSERT INTO settings (key, value) VALUES ('currency', 'PKR')");
    db.run("INSERT INTO settings (key, value) VALUES ('active_shift_type', 'Day')");
    db.run("INSERT INTO settings (key, value) VALUES ('day_employee_1', 'Muhammad Ali')");
    db.run("INSERT INTO settings (key, value) VALUES ('day_employee_2', 'Usman Tariq')");
    db.run("INSERT INTO settings (key, value) VALUES ('night_employee_1', 'Hamza Khan')");
    db.run("INSERT INTO settings (key, value) VALUES ('night_employee_2', 'Bilal Ahmed')");
    db.run("INSERT INTO settings (key, value) VALUES ('short_items_staff', ?)", [JSON.stringify(['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'])]);
    db.run("INSERT INTO settings (key, value) VALUES ('short_item_pharmacies', ?)", [JSON.stringify(['Local Pharmacy', 'Medicine Market'])]);
  }

  // Ensure short_items_staff exists for existing databases
  const existingShortStaff = queryOne("SELECT value FROM settings WHERE key = 'short_items_staff'");
  if (!existingShortStaff) {
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('short_items_staff', ?)", [
      JSON.stringify(['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)'])
    ]);
  }
  const existingPharmacies = queryOne("SELECT value FROM settings WHERE key = 'short_item_pharmacies'");
  if (!existingPharmacies) {
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('short_item_pharmacies', ?)", [
      JSON.stringify(['Local Pharmacy', 'Medicine Market'])
    ]);
  }

  // Ensure theme exists for existing databases
  const existingTheme = queryOne("SELECT value FROM settings WHERE key = 'theme'");
  if (!existingTheme) {
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'light')");
  }

  // Seed default 4 employees if table is empty
  const empCount = queryOne("SELECT COUNT(*) as count FROM employees");
  if (!empCount || empCount.count === 0) {
    db.run("INSERT INTO employees (name, assigned_shift, role) VALUES ('Muhammad Ali', 'Day', 'Primary / Lead')");
    db.run("INSERT INTO employees (name, assigned_shift, role) VALUES ('Usman Tariq', 'Day', 'Assistant / Cashier')");
    db.run("INSERT INTO employees (name, assigned_shift, role) VALUES ('Hamza Khan', 'Night', 'Night Pharmacist')");
    db.run("INSERT INTO employees (name, assigned_shift, role) VALUES ('Bilal Ahmed', 'Night', 'Night Cashier')");
  }
}

function getSetting(key) {
  const row = queryOne("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : null;
}

function getAllEmployees() {
  if (!db) return [];
  return queryAll("SELECT * FROM employees ORDER BY id ASC");
}

function saveEmployee(data) {
  if (!db) return null;
  if (data.id) {
    run("UPDATE employees SET name = ?, assigned_shift = ?, role = ? WHERE id = ?", [
      data.name, data.assigned_shift || 'Day', data.role || 'Counter Staff', data.id
    ]);
    return queryOne("SELECT * FROM employees WHERE id = ?", [data.id]);
  } else {
    const res = run("INSERT INTO employees (name, assigned_shift, role) VALUES (?, ?, ?)", [
      data.name, data.assigned_shift || 'Day', data.role || 'Counter Staff'
    ]);
    return queryOne("SELECT * FROM employees WHERE id = ?", [res.lastInsertRowid]);
  }
}

function deleteEmployee(id) {
  if (!db) return { success: false };
  run("DELETE FROM employees WHERE id = ?", [id]);
  return { success: true, id };
}

function updateActiveShiftStaff({ shift_type, employee_1, employee_2, save_as_default }) {
  if (!db) return null;
  const active = ensureActiveShift();
  if (!active) return null;

  const sType = shift_type || active.shift_type || 'Day';
  const e1 = employee_1 !== undefined ? employee_1 : (active.employee_1 || '');
  const e2 = employee_2 !== undefined ? employee_2 : (active.employee_2 || '');
  const cName = `${e1} & ${e2}`;

  run(`
    UPDATE shifts 
    SET shift_type = ?, employee_1 = ?, employee_2 = ?, cashier_name = ?
    WHERE id = ?
  `, [sType, e1, e2, cName, active.id]);

  if (save_as_default) {
    if (sType === 'Day') {
      updateSettings({ day_employee_1: e1, day_employee_2: e2, active_shift_type: sType });
    } else {
      updateSettings({ night_employee_1: e1, night_employee_2: e2, active_shift_type: sType });
    }
  } else {
    updateSettings({ active_shift_type: sType });
  }

  return queryOne("SELECT * FROM shifts WHERE id = ?", [active.id]);
}

function ensureActiveShift() {
  if (!db) return null;
  let active = queryOne("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
  if (!active) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sType = getSetting('active_shift_type') || 'Day';
    const e1 = sType === 'Night' ? (getSetting('night_employee_1') || 'Hamza Khan') : (getSetting('day_employee_1') || 'Muhammad Ali');
    const e2 = sType === 'Night' ? (getSetting('night_employee_2') || 'Bilal Ahmed') : (getSetting('day_employee_2') || 'Usman Tariq');
    const shiftCode = `SHF-${today}-${sType.toUpperCase()}-01`;
    const cName = `${e1} & ${e2}`;

    run(`
      INSERT INTO shifts (shift_code, register_station, shift_type, employee_1, employee_2, cashier_name, opening_float, status)
      VALUES (?, 'Register 01', ?, ?, ?, ?, 0.0, 'OPEN')
    `, [shiftCode, sType, e1, e2, cName]);

    active = queryOne("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
  } else if (!active.employee_1 || !active.employee_2 || active.cashier_name === ' & ' || !active.cashier_name) {
    const sType = active.shift_type || getSetting('active_shift_type') || 'Day';
    const e1 = active.employee_1 || (sType === 'Night' ? (getSetting('night_employee_1') || 'Hamza Khan') : (getSetting('day_employee_1') || 'Muhammad Ali'));
    const e2 = active.employee_2 || (sType === 'Night' ? (getSetting('night_employee_2') || 'Bilal Ahmed') : (getSetting('day_employee_2') || 'Usman Tariq'));
    const cName = `${e1} & ${e2}`;
    run("UPDATE shifts SET shift_type = ?, employee_1 = ?, employee_2 = ?, cashier_name = ? WHERE id = ?", [
      sType, e1, e2, cName, active.id
    ]);
    active = queryOne("SELECT * FROM shifts WHERE id = ?", [active.id]);
  }
  return active;
}

function getActiveShift() {
  return ensureActiveShift();
}

function updateOpeningFloat(shiftId, amount) {
  if (!db) return;
  const num = Number(amount) || 0;
  run("UPDATE shifts SET opening_float = ? WHERE id = ?", [num, shiftId]);
  return getActiveShift();
}

function getNextInvoiceNumber() {
  if (!db) return 'INV-2026-0001';
  const lastEntry = queryOne("SELECT id, invoice_number FROM ledger_entries ORDER BY id DESC LIMIT 1");
  const year = new Date().getFullYear();
  if (!lastEntry || !lastEntry.invoice_number) {
    return `INV-${year}-0001`;
  }
  const match = String(lastEntry.invoice_number).match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : (lastEntry.id || 0) + 1;
  return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
}

function addLedgerEntry({ shift_id, invoice_number, customer_type, amount, payment_method, notes, employee_1, employee_2, shift_type }) {
  if (!db) throw new Error('Database not initialized');
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid transaction amount');
  }

  const active = ensureActiveShift();
  const targetShiftId = shift_id || (active ? active.id : 1);
  const inv = invoice_number || getNextInvoiceNumber();
  const cType = customer_type || 'Walk-in Customer';
  const method = payment_method === 'QR_CODE' ? 'QR_CODE' : (payment_method === 'CARD' || payment_method === 'ONLINE') ? 'CARD' : 'CASH';
  const sType = shift_type || active?.shift_type || 'Day';
  const e1 = employee_1 || active?.employee_1 || '';
  const e2 = employee_2 || active?.employee_2 || '';

  const res = run(`
    INSERT INTO ledger_entries (shift_id, invoice_number, customer_type, amount, payment_method, notes, shift_type, employee_1, employee_2, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `, [targetShiftId, inv, cType, numAmount, method, notes || '', sType, e1, e2]);

  const inserted = queryOne("SELECT * FROM ledger_entries WHERE id = ?", [res.lastInsertRowid]);
  return {
    entry: inserted,
    nextInvoice: getNextInvoiceNumber(),
    summary: getShiftSummary(targetShiftId)
  };
}

function deleteLedgerEntry(id) {
  if (!db) return null;
  const entry = queryOne("SELECT * FROM ledger_entries WHERE id = ?", [id]);
  if (!entry) return null;
  run("DELETE FROM ledger_entries WHERE id = ?", [id]);
  recalculateClosingForShift(entry.shift_id);
  return { success: true, deletedId: id, shift_id: entry.shift_id, entity: entry };
}

function getRecentEntries(shiftId, limit = 50) {
  if (!db) return [];
  const active = ensureActiveShift();
  const targetShiftId = shiftId || (active ? active.id : 1);
  return queryAll(`
    SELECT * FROM ledger_entries 
    WHERE shift_id = ? 
    ORDER BY id DESC 
    LIMIT ?
  `, [targetShiftId, limit]);
}

function getAllLedgerEntries(filters = {}) {
  if (!db) return [];
  let sql = `
    SELECT l.*, s.shift_code, s.register_station, s.cashier_name
    FROM ledger_entries l
    LEFT JOIN shifts s ON l.shift_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.shiftId !== undefined && filters.shiftId !== null) {
    sql += ` AND l.shift_id = ?`;
    params.push(Number(filters.shiftId));
  }

  if (filters.method && filters.method !== 'ALL') {
    sql += ` AND l.payment_method = ?`;
    params.push(filters.method);
  }

  if (filters.customerType && filters.customerType !== 'ALL') {
    sql += ` AND l.customer_type = ?`;
    params.push(filters.customerType);
  }

  if (filters.shiftType && filters.shiftType !== 'ALL') {
    sql += ` AND (l.shift_type = ? OR s.shift_type = ?)`;
    params.push(filters.shiftType, filters.shiftType);
  }

  if (filters.search) {
    sql += ` AND (l.invoice_number LIKE ? OR l.notes LIKE ? OR l.customer_type LIKE ? OR l.employee_1 LIKE ? OR l.employee_2 LIKE ?)`;
    const s = `%${filters.search}%`;
    params.push(s, s, s, s, s);
  }

  if (filters.startDate) {
    sql += ` AND l.created_at >= ?`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    sql += ` AND l.created_at <= ?`;
    params.push(filters.endDate);
  }

  sql += ` ORDER BY l.id DESC`;

  if (filters.limit) {
    sql += ` LIMIT ?`;
    params.push(Number(filters.limit));
  }

  return queryAll(sql, params);
}

function addShortItem(data) {
  if (!db) throw new Error('Database not initialized');
  const active = ensureActiveShift();
  if (!active) throw new Error('No active shift found');

  const shift_id = active.id;
  const amount = parseFloat(data.amount) || 0;
  if (amount <= 0) throw new Error('Invalid amount');

  const res = run(`
    INSERT INTO short_items (shift_id, amount, given_to, notes)
    VALUES (?, ?, ?, ?)
  `, [shift_id, amount, data.given_to || '', data.notes || '']);

  return queryOne("SELECT * FROM short_items WHERE id = ?", [res.lastInsertRowid]);
}

function updateShortItem(id, data) {
  if (!db) throw new Error('Database not initialized');
  const existing = queryOne("SELECT * FROM short_items WHERE id = ?", [id]);
  if (!existing) throw new Error('Short item not found');

  const amount = parseFloat(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
  const billAmount = Number(existing.bill_amount || existing.spent_amount) || 0;
  if (existing.status === 'RETURNED' && amount < billAmount) {
    throw new Error('Issued amount cannot be less than bill amount');
  }

  const returnedAmount = existing.status === 'RETURNED' ? amount - billAmount : 0;
  const spentAmount = existing.status === 'RETURNED' ? billAmount : 0;
  run(`
    UPDATE short_items
    SET amount = ?, given_to = ?, notes = ?, spent_amount = ?, returned_amount = ?
    WHERE id = ?
  `, [amount, String(data.given_to || '').trim(), String(data.notes || '').trim(), spentAmount, returnedAmount, id]);

  recalculateClosingForShift(existing.shift_id);

  return queryOne("SELECT * FROM short_items WHERE id = ?", [id]);
}

function deleteShortItem(id) {
  if (!db) throw new Error('Database not initialized');
  const existing = queryOne("SELECT * FROM short_items WHERE id = ?", [id]);
  if (!existing) throw new Error('Short item not found');
  run("DELETE FROM short_items WHERE id = ?", [id]);
  recalculateClosingForShift(existing.shift_id);
  return { success: true, shift_id: existing.shift_id, entity: existing };
}

function returnShortItem(id, data) {
  if (!db) throw new Error('Database not initialized');
  const existing = queryOne("SELECT * FROM short_items WHERE id = ?", [id]);
  if (!existing) throw new Error('Short item not found');

  const billAmount = Number(data.bill_amount);
  if (!Number.isFinite(billAmount) || billAmount < 0) throw new Error('Invalid bill amount');
  if (billAmount > Number(existing.amount)) throw new Error('Bill amount cannot exceed given amount');
  const referenceNo = String(data.reference_no || '').trim();
  const pharmacy = String(data.pharmacy || '').trim();
  if (!referenceNo) throw new Error('Reference number is required');
  if (!pharmacy) throw new Error('Pharmacy name is required');
  const returnedAmount = Number(existing.amount) - billAmount;

  run(`
    UPDATE short_items 
    SET status = 'RETURNED', returned_amount = ?, spent_amount = ?, bill_amount = ?,
      reference_no = ?, pharmacy = ?, returned_at = datetime('now', 'localtime')
    WHERE id = ?
  `, [returnedAmount, billAmount, billAmount, referenceNo, pharmacy, id]);

  recalculateClosingForShift(existing.shift_id);

  return queryOne("SELECT * FROM short_items WHERE id = ?", [id]);
}

function getShortItems(shiftId) {
  if (!db) return [];
  if (shiftId === 'ALL') {
    return queryAll("SELECT s.*, sh.shift_type FROM short_items s LEFT JOIN shifts sh ON s.shift_id = sh.id ORDER BY s.id DESC");
  }
  const active = ensureActiveShift();
  const targetShiftId = shiftId || (active ? active.id : 1);
  return queryAll("SELECT s.*, sh.shift_type FROM short_items s LEFT JOIN shifts sh ON s.shift_id = sh.id WHERE s.shift_id = ? ORDER BY s.id DESC", [targetShiftId]);
}

function getShiftSummary(shiftId) {
  if (!db) return null;
  const active = ensureActiveShift();
  const targetShift = shiftId ? queryOne("SELECT * FROM shifts WHERE id = ?", [shiftId]) : active;
  if (!targetShift) return null;

  const entries = queryAll("SELECT amount, payment_method FROM ledger_entries WHERE shift_id = ?", [targetShift.id]);
  
  let cashInflow = 0;
  let onlineCollections = 0;
  let cardCollections = 0;
  let qrCollections = 0;
  let cashCount = 0;
  let onlineCount = 0;
  let cardCount = 0;
  let qrCount = 0;

  for (const e of entries) {
    const amt = Number(e.amount) || 0;
    if (e.payment_method === 'CASH') {
      cashInflow += amt;
      cashCount++;
    } else if (e.payment_method === 'QR_CODE') {
      qrCollections += amt;
      onlineCollections += amt;
      qrCount++;
      onlineCount++;
    } else {
      cardCollections += amt;
      onlineCollections += amt;
      cardCount++;
      onlineCount++;
    }
  }

  const totalRevenue = cashInflow + onlineCollections;
  const totalCount = cashCount + onlineCount;
  const openingFloat = Number(targetShift.opening_float) || 0;

  // Calculate Short Items
  const shortItems = queryAll("SELECT * FROM short_items WHERE shift_id = ?", [targetShift.id]);
  let pendingShortItemsCount = 0;
  let totalSpentOnShortItems = 0;
  let totalPendingAmount = 0;

  for (const item of shortItems) {
    if (item.status === 'PENDING') {
      pendingShortItemsCount++;
      totalPendingAmount += (Number(item.amount) || 0);
    } else if (item.status === 'RETURNED') {
      totalSpentOnShortItems += (Number(item.spent_amount) || 0);
    }
  }

  const expectedDrawerCash = openingFloat + cashInflow - totalSpentOnShortItems - totalPendingAmount;
  const totalShortItemsDeduction = totalSpentOnShortItems + totalPendingAmount;

  const cashShare = totalRevenue > 0 ? ((cashInflow / totalRevenue) * 100).toFixed(1) : '0.0';
  const onlineShare = totalRevenue > 0 ? ((onlineCollections / totalRevenue) * 100).toFixed(1) : '0.0';

  return {
    shift: targetShift,
    totalRevenue,
    cashInflow,
    onlineCollections,
    cardCollections,
    qrCollections,
    cashCount,
    onlineCount,
    cardCount,
    qrCount,
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
}

function backupDatabase() {
  if (!dbFilePath || !fs.existsSync(dbFilePath)) return;
  try {
    const backupDir = path.join(path.dirname(dbFilePath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Format timestamp like: 2026-09-21_15-30-00
    const dateStr = new Date().toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `cashbook_backup_${dateStr}.sqlite`);
    
    // Copy the current database to the backups folder
    fs.copyFileSync(dbFilePath, backupPath);
    console.log(`[DB] Auto-backup created successfully: ${backupPath}`);
    
    // Keep only the last 30 backups to save space
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('cashbook_backup_') && f.endsWith('.sqlite'))
      .map(f => ({ path: path.join(backupDir, f), time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
      
    if (files.length > 30) {
      files.slice(30).forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
  } catch (err) {
    console.error('[DB] Auto-backup failed:', err);
  }
}

function saveShiftClosing({
  shift_id,
  shift_type,
  employee_1,
  employee_2,
  cashier_name,
  opening_float,
  cash_sales,
  online_sales,
  total_revenue,
  expected_drawer_cash,
  counted_cash,
  variance,
  status,
  denominations_json,
  audit_notes,
  carryOverFloatAsNewShift,
  next_shift_type,
  next_employee_1,
  next_employee_2
}) {
  if (!db) throw new Error('Database not initialized');

  const active = ensureActiveShift();
  const targetShiftId = shift_id || (active ? active.id : 1);

  const sType = shift_type || active?.shift_type || 'Day';
  const e1 = employee_1 || active?.employee_1 || '';
  const e2 = employee_2 || active?.employee_2 || '';
  const cName = cashier_name || `${e1} & ${e2}`;

  // Generate next closing code e.g. CLS-1001, CLS-1002
  const lastClosing = queryOne("SELECT id FROM shift_closings ORDER BY id DESC LIMIT 1");
  const nextId = lastClosing ? 1001 + lastClosing.id : 1001;
  const closingCode = `CLS-${nextId}`;

  run(`
    INSERT INTO shift_closings (
      closing_code, shift_id, shift_type, employee_1, employee_2, cashier_name,
      opening_float, cash_sales, online_sales, total_revenue, expected_drawer_cash,
      counted_cash, variance, status, denominations_json, audit_notes, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `, [
    closingCode,
    targetShiftId,
    sType,
    e1,
    e2,
    cName,
    Number(opening_float) || 0,
    Number(cash_sales) || 0,
    Number(online_sales) || 0,
    Number(total_revenue) || 0,
    Number(expected_drawer_cash) || 0,
    Number(counted_cash) || 0,
    Number(variance) || 0,
    status || 'Balanced',
    typeof denominations_json === 'string' ? denominations_json : JSON.stringify(denominations_json || {}),
    audit_notes || ''
  ]);

  // Mark current shift as CLOSED
  run("UPDATE shifts SET status = 'CLOSED', closed_at = datetime('now', 'localtime') WHERE id = ?", [targetShiftId]);

  // Start new shift session with the SAME shift type (shifts are only switched manually)
  const nextType = next_shift_type || sType;
  const nextE1 = next_employee_1 || (nextType === 'Night' ? (getSetting('night_employee_1') || 'Hamza Khan') : (getSetting('day_employee_1') || 'Muhammad Ali'));
  const nextE2 = next_employee_2 || (nextType === 'Night' ? (getSetting('night_employee_2') || 'Bilal Ahmed') : (getSetting('day_employee_2') || 'Usman Tariq'));
  const nextCName = `${nextE1} & ${nextE2}`;

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const newShiftCode = `SHF-${today}-${nextType.toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const newFloat = carryOverFloatAsNewShift ? Number(counted_cash) : 0.0;
  
  run(`
    INSERT INTO shifts (shift_code, register_station, shift_type, employee_1, employee_2, cashier_name, opening_float, status)
    VALUES (?, 'Register 01', ?, ?, ?, ?, ?, 'OPEN')
  `, [newShiftCode, nextType, nextE1, nextE2, nextCName, newFloat]);

  updateSettings({ active_shift_type: nextType });

  const newActiveShift = ensureActiveShift();
  const insertedClosing = queryOne("SELECT * FROM shift_closings WHERE closing_code = ?", [closingCode]);

  // Actually trigger the backup!
  backupDatabase();

  return {
    closing: insertedClosing,
    newShift: newActiveShift
  };
}

function getAllClosings(filters = {}) {
  if (!db) return [];
  let sql = "SELECT * FROM shift_closings WHERE 1=1";
  const params = [];
  if (filters?.shiftType && filters.shiftType !== 'ALL') {
    sql += " AND shift_type = ?";
    params.push(filters.shiftType);
  }
  sql += " ORDER BY id DESC";
  return queryAll(sql, params);
}

function getClosingById(id) {
  if (!db) return null;
  return queryOne("SELECT * FROM shift_closings WHERE id = ? OR closing_code = ?", [id, id]);
}

function recalculateClosingForShift(shiftId) {
  const closing = queryOne("SELECT * FROM shift_closings WHERE shift_id = ? AND COALESCE(is_void, 0) = 0 ORDER BY id DESC LIMIT 1", [shiftId]);
  if (!closing) return null;
  const summary = getShiftSummary(shiftId);
  if (!summary) return closing;

  const variance = Number(closing.counted_cash || 0) - Number(summary.expectedDrawerCash || 0);
  const status = Math.abs(variance) < 0.01 ? 'Balanced' : variance < 0 ? 'Shortage' : 'Overage';
  run(`
    UPDATE shift_closings SET opening_float = ?, cash_sales = ?, online_sales = ?,
      total_revenue = ?, expected_drawer_cash = ?, variance = ?, status = ?,
      updated_at = datetime('now', 'localtime') WHERE id = ?
  `, [summary.openingFloat, summary.cashInflow, summary.onlineCollections, summary.totalRevenue,
    summary.expectedDrawerCash, variance, status, closing.id]);
  return queryOne("SELECT * FROM shift_closings WHERE id = ?", [closing.id]);
}

function updateShiftClosing(id, data) {
  if (!db) throw new Error('Database not initialized');
  const closing = queryOne("SELECT * FROM shift_closings WHERE id = ?", [id]);
  if (!closing) throw new Error('Closing not found');
  if (Number(closing.is_void)) throw new Error('A void closing cannot be edited');

  const countedCash = Number(data.counted_cash);
  if (!Number.isFinite(countedCash) || countedCash < 0) throw new Error('Invalid counted cash');
  run(`UPDATE shift_closings SET employee_1 = ?, employee_2 = ?, cashier_name = ?,
    counted_cash = ?, denominations_json = ?, audit_notes = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?`, [
    String(data.employee_1 || '').trim(), String(data.employee_2 || '').trim(),
    `${String(data.employee_1 || '').trim()} & ${String(data.employee_2 || '').trim()}`,
    countedCash,
    typeof data.denominations_json === 'string' ? data.denominations_json : JSON.stringify(data.denominations_json || {}),
    String(data.audit_notes || '').trim(), id
  ]);
  return recalculateClosingForShift(closing.shift_id);
}

function voidShiftClosing(id, reason) {
  if (!db) throw new Error('Database not initialized');
  const closing = queryOne("SELECT * FROM shift_closings WHERE id = ?", [id]);
  if (!closing) throw new Error('Closing not found');
  if (Number(closing.is_void)) return closing;
  const cleanReason = String(reason || '').trim();
  if (!cleanReason) throw new Error('Void reason is required');
  run(`UPDATE shift_closings SET is_void = 1, status = 'VOID', void_reason = ?,
    voided_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?`, [cleanReason, id]);
  return queryOne("SELECT * FROM shift_closings WHERE id = ?", [id]);
}

function getSettings() {
  if (!db) return {};
  const rows = queryAll("SELECT key, value FROM settings");
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return settings;
}

function updateSettings(newSettings) {
  if (!db) return;
  for (const [key, value] of Object.entries(newSettings)) {
    const existing = queryOne("SELECT key FROM settings WHERE key = ?", [key]);
    if (existing) {
      run("UPDATE settings SET value = ? WHERE key = ?", [String(value), key]);
    } else {
      run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, String(value)]);
    }
  }
  return getSettings();
}

function updateLedgerEntry(id, data) {
  if (!db) return null;
  const existing = queryOne("SELECT * FROM ledger_entries WHERE id = ?", [id]);
  if (!existing) return null;
  const method = data.payment_method === 'QR_CODE' ? 'QR_CODE' : (data.payment_method === 'CARD' || data.payment_method === 'ONLINE') ? 'CARD' : 'CASH';
  run(`
    UPDATE ledger_entries 
    SET customer_type = ?, payment_method = ?, notes = ?, amount = ?
    WHERE id = ?
  `, [
    data.customer_type || 'Walk-in Customer',
    method,
    data.notes || '',
    parseFloat(data.amount) || 0,
    id
  ]);
  recalculateClosingForShift(existing.shift_id);
  return queryOne("SELECT * FROM ledger_entries WHERE id = ?", [id]);
}

function getBackupsList() {
  if (!dbFilePath) return [];
  try {
    const backupDir = path.join(path.dirname(dbFilePath), 'backups');
    if (!fs.existsSync(backupDir)) return [];
    return fs.readdirSync(backupDir)
      .filter(f => f.startsWith('cashbook_backup_') && f.endsWith('.sqlite'))
      .map(f => {
        const stat = fs.statSync(path.join(backupDir, f));
        return { filename: f, size: stat.size, time: stat.mtime.getTime() };
      })
      .sort((a, b) => b.time - a.time);
  } catch(e) { return []; }
}

function restoreBackup(filename) {
  if (!dbFilePath) throw new Error('Database path missing');
  try {
    const backupDir = path.join(path.dirname(dbFilePath), 'backups');
    const targetBackup = path.join(backupDir, filename);
    if (!fs.existsSync(targetBackup)) throw new Error('Backup file not found');
    fs.copyFileSync(dbFilePath, dbFilePath + '.emergency-prerestore');
    fs.copyFileSync(targetBackup, dbFilePath);
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  initDb,
  getActiveShift,
  updateOpeningFloat,
  updateActiveShiftStaff,
  getAllEmployees,
  saveEmployee,
  deleteEmployee,
  getNextInvoiceNumber,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  getRecentEntries,
  getAllLedgerEntries,
  getShiftSummary,
  saveShiftClosing,
  getAllClosings,
  getClosingById,
  updateShiftClosing,
  voidShiftClosing,
  getSettings,
  updateSettings,
  getBackupsList,
  restoreBackup,
  addShortItem,
  updateShortItem,
  deleteShortItem,
  returnShortItem,
  getShortItems
};
