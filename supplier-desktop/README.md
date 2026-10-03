# Zada Supplier Reconciliation

Separate Electron app for supplier bills and linked payments. It stores data locally in SQLite and syncs changes to `https://cashbook-e9h7.onrender.com` with an offline retry outbox.

## Run

```bash
npm install
npm run app
```

Use **Pay** on a bill to record partial or complete payments. Totals, tax deduction, actual payable, paid amount, remaining balance and payment status are calculated automatically. Bill-to-bill, sale-based and disputed entries can be categorized without creating fake settlement rows.

The server must be redeployed with the new `/api/v1/suppliers/*` routes before live sync and CEO reports will return data.
