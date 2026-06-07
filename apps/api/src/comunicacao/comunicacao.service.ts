import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTOS, MencaoCriadaEvento, TipoMencao } from '@interno/shared';
import { PrismaService } from '../prisma';
import { RealtimeGateway } from '../realtime';

interface MencaoInput {
  tipo: TipoMencao;
  alvoId: string; // usuarioId ou clienteId
}

@Injectable()
export class ComunicacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
    private readonly realtime: RealtimeGateway,
  ) {}

  listarCanais() {
    return this.prisma.canal.findMany({ orderBy: { criadoEm: 'asc' } });
  }

  mensagensDoCanal(canalId: string, limite = 80) {
    return this.prisma.mensagem.findMany({
      where: { canalId, threadPaiId: null },
      include: {
        autor: { select: { id: true, nome: true, avatarCor: true } },
        mencoes: true,
        respostas: {
          include: { autor: { select: { id: true, nome: true, avatarCor: true } } },
          orderBy: { criadoEm: 'asc' },
        },
      },
      orderBy: { criadoEm: 'asc' },
      take: limite,
    });
  }

  // Cria mensagem + menções. Cada @cliente vira evento → entra no card daquele cliente.
  async enviar(input: {
    canalId: string;
    autorId: string;
    conteudo: string;
    threadPaiId?: string;
    mencoes?: MencaoInput[];
  }) {
    const mensagem = await this.prisma.mensagem.create({
      data: {
        canalId: input.canalId,
        autorId: input.autorId,
        conteudo: input.conteudo,
        threadPaiId: input.threadPaiId,
        mencoes: {
          create: (input.mencoes ?? []).map((m) => ({
            tipo: m.tipo,
            usuarioId: m.tipo === TipoMencao.USUARIO ? m.alvoId : undefined,
            clienteId: m.tipo === TipoMencao.CLIENTE ? m.alvoId : undefined,
          })),
        },
      },
      include: { mencoes: true, autor: { select: { id: true, nome: true, avatarCor: true } } },
    });

    this.realtime.emitir(`canal:${input.canalId}`, 'mensagem', mensagem);

    for (const mencao of mensagem.mencoes) {
      this.eventos.emit(EVENTOS.MENCAO_CRIADA, {
        mencaoId: mencao.id,
        tipo: mencao.tipo,
        alvoId: (mencao.clienteId ?? mencao.usuarioId)!,
        mensagemId: mensagem.id,
        canalId: input.canalId,
        autorId: input.autorId,
        trecho: input.conteudo.slice(0, 280),
      } satisfies MencaoCriadaEvento);
    }
    return mensagem;
  }
}
