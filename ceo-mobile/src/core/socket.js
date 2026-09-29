import { io } from 'socket.io-client';
import { config } from './config';

export function createLiveSocket() {
  return io(config.apiUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    auth: { pharmacyId: config.pharmacyId, branchId: config.branchId },
  });
}
