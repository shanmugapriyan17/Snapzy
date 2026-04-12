import { io } from 'socket.io-client'

let socket = null

export function connectSocket(userId) {
  if (socket?.connected) return socket
  socket = io('/', { auth: { userId }, transports: ['websocket'] })
  socket.on('connect', () => console.log('[Socket] Connected'))
  socket.on('connect_error', (e) => console.warn('[Socket] Error:', e.message))
  return socket
}

export function getSocket() { return socket }

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
