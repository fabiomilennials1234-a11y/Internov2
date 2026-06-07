import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', { path: '/socket.io', transports: ['websocket'] });
  }
  return socket;
}

// Entra numa sala (canal:<id>, cliente:<id>, pessoa:<id>) e ouve um evento.
export function entrarNaSala(sala: string, evento: string, cb: (payload: unknown) => void): () => void {
  const s = getSocket();
  s.emit('entrar', sala);
  s.on(evento, cb);
  return () => {
    s.off(evento, cb);
  };
}
