# Zada CEO Mobile

A deliberately focused, read-only React Native/Expo app for live summary and past closing summaries. Login is skipped in this version.

## Run

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_URL` to the server computer's LAN address, for example `http://192.168.1.20:4100` (not `localhost` when using a physical phone).
3. Run `npm install` and `npm start` in this folder.
4. Open it with Expo Go or an emulator.

The dashboard reconnects automatically and receives Socket.IO updates whenever the counter app creates or changes an entry. Pull down on either list to refresh manually.
