import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// Gateway único compartilhado: chat/mural, notificações e TV-dashboard.
@Injectable()
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' } })
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  // cliente entra na sala do próprio usuário (notificações) e em salas de canal/tv
  @SubscribeMessage('entrar')
  entrar(@MessageBody() sala: string, @ConnectedSocket() socket: Socket) {
    socket.join(sala);
    return { ok: true, sala };
  }

  emitir(sala: string, evento: string, payload: unknown) {
    this.server?.to(sala).emit(evento, payload);
  }

  broadcast(evento: string, payload: unknown) {
    this.server?.emit(evento, payload);
  }
}
