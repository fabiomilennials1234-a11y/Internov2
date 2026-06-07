import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTOS } from '@interno/shared';
import { PrismaService } from '../prisma';

@Injectable()
export class AgendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
  ) {}

  // Diretoria vê a agenda de todos por padrão (filtro por usuário é opcional).
  eventos_(de: Date, ate: Date, usuarioId?: string) {
    return this.prisma.eventoAgenda.findMany({
      where: {
        inicio: { gte: de, lte: ate },
        ...(usuarioId ? { participantes: { some: { usuarioId } } } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        participantes: { include: { usuario: { select: { id: true, nome: true, avatarCor: true } } } },
      },
      orderBy: { inicio: 'asc' },
    });
  }

  async criar(input: {
    titulo: string;
    inicio: Date;
    fim: Date;
    criadorId: string;
    clienteId?: string;
    participantes?: string[];
  }) {
    const evento = await this.prisma.eventoAgenda.create({
      data: {
        titulo: input.titulo,
        inicio: input.inicio,
        fim: input.fim,
        criadorId: input.criadorId,
        clienteId: input.clienteId,
        participantes: { create: (input.participantes ?? []).map((usuarioId) => ({ usuarioId })) },
      },
    });
    this.eventos.emit(EVENTOS.EVENTO_CRIADO, { eventoId: evento.id });
    return evento;
  }
}
