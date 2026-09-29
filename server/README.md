# Zada CEO Server

Flexible API and live-update layer between the existing CashBook desktop app and the CEO mobile app.

## Start locally

1. Start MongoDB.
2. Copy `.env.example` to `.env` and update `MONGODB_URI` if needed.
3. Run `npm install` and `npm run dev` inside this folder.
4. Check `http://localhost:4100/api/health`.

Authentication is intentionally disabled for the first version. Do not expose this server directly to the public internet. Keep it on a trusted LAN/VPN until authentication is enabled.

The API is versioned under `/api/v1`, data is scoped by pharmacy and branch, mutations arrive as versioned events, and Mongo documents retain the original desktop record in `raw`. These boundaries allow later CEO features to be added without rewriting the sync system.

Set these variables before starting the desktop app so it can sync:

```text
CEO_SERVER_URL=http://SERVER_LAN_IP:4100
CEO_PHARMACY_ID=zada-pharmacy
CEO_BRANCH_ID=main
```
