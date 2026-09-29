import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase } from './core/database/connect.js';
import { registerSocketHandlers } from './core/events/socket.js';
import { env } from './config/env.js';

await connectDatabase();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.clientOrigins === '*' ? '*' : env.clientOrigins.split(',') } });
registerSocketHandlers(io);
server.listen(env.port, '0.0.0.0', () => console.log(`[server] Listening on :${env.port}`));
