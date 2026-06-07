import { Injectable } from '@nestjs/common';
import { AtividadeFeedItem } from '@interno/shared';
import { PrismaService } from '../prisma';
import { RealtimeGateway } from '../realtime';

@Injectable()
export class AtividadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Ponto único de escrita do feed. Indexado por ator (pessoa) e por cliente (alvo).
  async registrar(item: AtividadeFeedItem) {
    const atividade = await this.prisma.atividade.create({
      data: {
        tipo: item.tipo,
        resumo: item.resumo,
        atorId: item.atorId ?? undefined,
        clienteId: item.clienteId ?? undefined,
        projetoId: item.projetoId ?? undefined,
        mensagemId: item.mensagemId ?? undefined,
        payload: (item.payload ?? undefined) as never,
      },
    });
    if (item.clienteId) this.realtime.emitir(`cliente:${item.clienteId}`, 'atividade', atividade);
    if (item.atorId) this.realtime.emitir(`pessoa:${item.atorId}`, 'atividade', atividade);
    return atividade;
  }

  // timeline do card do cliente
  feedDoCliente(clienteId: string, limite = 50) {
    return this.prisma.atividade.findMany({
      where: { clienteId },
      include: { ator: { select: { id: true, nome: true, avatarCor: true } } },
      orderBy: { criadoEm: 'desc' },
      take: limite,
    });
  }

  // visão por pessoa — o que o diretor/funcionário fez
  feedDaPessoa(usuarioId: string, limite = 50) {
    return this.prisma.atividade.findMany({
      where: { atorId: usuarioId },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: limite,
    });
  }
}
