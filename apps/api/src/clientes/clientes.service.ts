import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EVENTOS,
  EstagioEntrega,
  SaudeCliente,
  ClienteEstagioAlteradoEvento,
  ClienteSaudeAlteradaEvento,
} from '@interno/shared';
import { PrismaService } from '../prisma';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
  ) {}

  listar() {
    return this.prisma.cliente.findMany({
      include: {
        responsavel: { select: { id: true, nome: true, avatarCor: true } },
        projetos: { select: { id: true, frente: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async card(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        responsavel: { select: { id: true, nome: true, avatarCor: true } },
        projetos: true,
        eventos: { orderBy: { inicio: 'asc' }, take: 5 },
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  criar(data: { nome: string; emoji?: string; responsavelId?: string; valorMensal?: number }) {
    return this.prisma.cliente.create({ data });
  }

  async mudarEstagio(id: string, estagio: EstagioEntrega, atorId: string) {
    const cliente = await this.prisma.cliente.update({ where: { id }, data: { estagioEntrega: estagio } });
    this.eventos.emit(EVENTOS.CLIENTE_ESTAGIO_ALTERADO, {
      clienteId: id,
      estagio,
      atorId,
    } satisfies ClienteEstagioAlteradoEvento);
    return cliente;
  }

  async mudarSaude(id: string, saude: SaudeCliente, atorId: string) {
    const cliente = await this.prisma.cliente.update({ where: { id }, data: { saude } });
    this.eventos.emit(EVENTOS.CLIENTE_SAUDE_ALTERADA, {
      clienteId: id,
      saude,
      atorId,
    } satisfies ClienteSaudeAlteradaEvento);
    return cliente;
  }
}
