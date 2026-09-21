# Zada Pharmacy — POS Cash Counter & Closings Console

A modern, lightning-fast desktop application built with **Electron + React + Tailwind CSS + SQLite** for pharmacy cash counters to manage real-time payment transactions (Cash vs. Online), reconcile physical drawer cash against opening petty cash floats, and produce finalized shift closing slips and audit archives.

---

## 🌟 Key Features

1. **Quick Ledger Entry (POS Console)**:
   - Giant numeric amount display with currency indicator (`PKR`).
   - Quick Add increment pills: `+PKR 50`, `+PKR 100`, `+PKR 500`, `+PKR 1000`, `+PKR 5000`.
   - Keyboard Shortcuts for rapid checkout:
     - Press <kbd>Enter</kbd> to record as **CASH**.
     - Press <kbd>Shift + Enter</kbd> to record as **ONLINE** (Cards, UPI, digital gateways).
     - Press <kbd>Escape</kbd> to clear amount input.
   - Auto-incrementing Invoice Number (e.g., `INV-2026-0038`) with manual override.
   - Customer Type selection (`Walk-in Customer`, `Regular Patient`, `Prescription Delivery`, `Hospital Staff`, `Emergency Care`).
   - Optional on-screen **Touch Keypad** for touchscreen terminals or mouse clicking.
   - Live **Today's Activity** side panel displaying drawer cash, online gateway sum, and real-time transaction feed with void/delete options.

2. **Executive Summary**:
   - Total Shift Revenue, Cash Inflow, Online Collections.
   - Dual-color Payment Method Distribution progress bar with exact percentage shares.
   - Individual Cash Drawer and Gateway transaction count breakdowns.
   - Shift status indicator (`BALANCED` / `IN PROGRESS`).
   - Quick action shortcuts to enter new transactions, start drawer closing, or preview shift slips.

3. **Shift Closing & Petty Cash Reconciliation**:
   - Starting Opening Petty Cash Float with presets (`Rs 2,000`, `Rs 5,000`, `Rs 10,000`).
   - Real-time formula breakdown: `Opening Float + Shift Cash Inflow = Expected Drawer Cash`.
   - Online / POS Gateway cross-audit totals.
   - **Physical Cash Denomination Counter**:
     - Increment/decrement note steppers for Rs 5,000, Rs 1,000, Rs 500, Rs 100, Rs 50, Rs 20, Rs 10, and Coins.
     - Helper tools: `Keep All Zeros (0.00)`, `Auto-fill Expected`, `Clear`.
     - Live variance comparison: indicates `DRAWER EXACTLY BALANCED` or warns with exact shortage/surplus.
   - Audit notes / remarks field and verification checkbox to enable finalization.

4. **All Closings Archive**:
   - Permanent archive of all historical shift closings saved in SQLite (`CLS-1001`, `CLS-1002`, etc.).
   - Summary metric cards for total shifts closed, total cash collected, total online received, and aggregated revenue.
   - Instant search by closing ID or cashier name, and filter tabs (`ALL`, `Balanced`, `Variance`).
   - 1-click **Slip** button to open the full printable receipt.

5. **All Ledgers (Master Transactions Log)**:
   - Full master transactions ledger with **newest entries displayed first**.
   - **Multi-Filter Toolbar**:
     - Payment Method pills: `All Methods`, `CASH`, `ONLINE`.
     - Customer Type dropdown: `All Customers`, `Walk-in Customer`, `Regular Patient`, `Prescription Delivery`, etc.
     - Date Range dropdown: `All Time`, `Today Only`, `Yesterday`, `Last 7 Days`, `This Month`.
     - Real-time search by invoice number, notes/remarks, or customer.
   - 4 Live Aggregate KPI cards: Recorded entries, Cash received, Online received, Total revenue.
   - Quick Void / Delete action with confirmation.
   - Export to **CSV** and 1-click **Print Ledger Sheet**.

6. **Printable Thermal / Audit Slip**:
   - Formatted for standard 80mm POS thermal receipt printers and A4 summary sheets.
   - Displays pharmacy header, shift ref, date/time, cashier, revenue breakdown, physical note count table, variance analysis, and cashier/manager signature lines.

---

## 🚀 Running & Distributing

### 1. Windows Installer (.exe Setup) — Recommended
Your full installable setup file is located at:
```
E:\CashBook\dist-installers\Zada Pharmacy POS Setup 1.0.0.exe
```
- Double-click to install.
- Automatically creates Desktop & Start Menu shortcuts.
- Manages file permissions and database paths cleanly.

### 2. Standalone Portable Executable
Your portable (no-installation needed) build is located at:
```
E:\CashBook\release-builds\ZadaPharmacyPOS-win32-x64\ZadaPharmacyPOS.exe
```

### 3. Re-building Anytime
- **Build Installer**:
  ```bash
  npm run dist:installer
  ```
- **Build Portable Directory**:
  ```bash
  npm run dist
  ```

2. **Development Mode (Hot-Reloading)**:
   ```bash
   npm run dev
   ```
   *Opens the web development server at `http://localhost:5173` with full persistent local storage.*

---

## 🗄️ Database Schema (SQLite)

The local SQLite database (`cashbook.sqlite`) stores:
- **`shifts`**: Active and archived shifts with opening floats and timestamps.
- **`ledger_entries`**: Transactions with amount, payment method (`CASH` / `ONLINE`), invoice number, and customer type.
- **`shift_closings`**: Finalized closings with denomination counts (JSON), calculated variance, audit remarks, and cashier info.
- **`settings`**: Configurable pharmacy name, currency code (`PKR`), register terminal station (`Register 01`), etc.
