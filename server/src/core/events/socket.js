let ioInstance = null;

export function setSocketServer(io) {
  ioInstance = io;
}

export function emitToScope(eventName, payload) {
  if (!ioInstance) return;
  const room = `${payload.pharmacyId}:${payload.branchId}`;
  ioInstance.to(room).emit(eventName, payload);
}

export function registerSocketHandlers(io) {
  setSocketServer(io);
  io.on('connection', (socket) => {
    const pharmacyId = String(socket.handshake.auth?.pharmacyId || 'zada-pharmacy');
    const branchId = String(socket.handshake.auth?.branchId || 'main');
    socket.join(`${pharmacyId}:${branchId}`);
    socket.emit('v1.system.sync-status', { connected: true, pharmacyId, branchId, at: new Date().toISOString() });
  });
}
