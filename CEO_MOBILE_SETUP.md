# CEO Mobile System

The repository now has three independent layers:

- Existing desktop app: remains the source of counter entries and local SQLite data.
- `server/`: Node.js, Express, MongoDB and Socket.IO sync/API service.
- `ceo-mobile/`: small read-only React Native app for live summary and past closings.

Shared calculation and event contracts live in `shared/`. The desktop sync outbox saves unsent events on disk and retries them, so a temporary server/network outage does not block counter work.

## Recommended deployment

Run MongoDB and `server/` on one always-on pharmacy computer or private cloud/VPN host. Configure `CEO_SERVER_URL` on the counter machine and `EXPO_PUBLIC_API_URL` on the CEO phone to point to that host. Because login is postponed, use only a trusted LAN or VPN in this version.

## Future extensions

New CEO screens can be added as versioned `/api/v1` modules. New real-time features should add a named event in `shared/event-names.js`, while existing mobile screens remain unaffected. Authentication middleware already has a dedicated boundary and can be enabled later without changing each feature route.
