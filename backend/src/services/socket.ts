import { Server } from 'socket.io';

let _io: Server | null = null;

export function initSocket(io: Server) {
  _io = io;

  io.on('connection', (socket) => {
    socket.on('track-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });
  });
}

export function getIO(): Server {
  if (!_io) throw new Error('Socket.IO not initialised');
  return _io;
}

export function emitOrderStatus(orderId: string, status: string) {
  getIO().to(`order:${orderId}`).emit('status-change', { status });
}

export function emitCourierLocation(
  orderId: string,
  lat: number,
  lng: number,
  heading: number
) {
  getIO().to(`order:${orderId}`).emit('courier-location', { lat, lng, heading });
}
