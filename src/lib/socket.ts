import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Server origin (no `/api/v1`). Uses `VITE_API_URL` or derives from `VITE_BASE_URL`. */
export function getSocketServerUrl(): string {
  const explicit = import.meta.env.VITE_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const base = (import.meta.env.VITE_BASE_URL ?? '').trim();
  const derived = base.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  return derived || 'http://localhost:3000';
}

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(getSocketServerUrl(), {
    path: '/socket.io',
    auth: { token: accessToken },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket!.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function updateSocketAuth(accessToken: string): void {
  if (!socket) return;
  socket.auth = { token: accessToken };
  if (!socket.connected) socket.connect();
}
