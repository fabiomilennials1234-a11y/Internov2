import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EVENTOS,
  EstagioEntrega,
  SaudeCliente,
  ClienteEstagioAlteradoEvento,
  ClienteSaudeAlteradaEvento,
  ClienteCriadoEvento,
  ClienteAtualizadoEvento,
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
        projetos: {
          orderBy: { criadoEm: 'asc' },
          include: { responsavel: { select: { id: true, nome: true, avatarCor: true } } },
        },
        eventos: { orderBy: { inicio: 'asc' }, take: 5 },
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async criar(
    data: { nome: string; emoji?: string; contato?: string; responsavelId?: string; valorMensal?: number },
    atorId?: string,
  ) {
    const cliente = await this.prisma.cliente.create({ data });
    this.eventos.emit(EVENTOS.CLIENTE_CRIADO, {
      clienteId: cliente.id,
      nome: cliente.nome,
      atorId,
    } satisfies ClienteCriadoEvento);
    return cliente;
  }

  // Edita dados gerais; emite CLIENTE_ATUALIZADO só com os campos que mudaram.
  async editar(
    id: string,
    data: { nome?: string; emoji?: string; contato?: string; responsavelId?: string; valorMensal?: number },
    atorId?: string,
  ) {
    const antes = await this.prisma.cliente.findUniqueOrThrow({ where: { id } });
    const cliente = await this.prisma.cliente.update({ where: { id }, data });
    const campos = (Object.keys(data) as (keyof typeof data)[]).filter(
      (k) => data[k] !== undefined && (antes as Record<string, unknown>)[k] !== cliente[k],
    );
    this.eventos.emit(EVENTOS.CLIENTE_ATUALIZADO, {
      clienteId: id,
      atorId,
      campos: campos as string[],
    } satisfies ClienteAtualizadoEvento);
    return cliente;
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
