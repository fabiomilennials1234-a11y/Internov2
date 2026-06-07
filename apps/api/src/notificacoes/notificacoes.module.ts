import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTOS,
  MencaoCriadaEvento,
  TarefaAtribuidaEvento,
  LembreteDisparadoEvento,
  TipoMencao,
} from '@interno/shared';
import { PrismaService } from '../prisma';
import { RealtimeGateway } from '../realtime';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

@Injectable()
export class NotificacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  minhas(usuarioId: string) {
    return this.prisma.notificacao.findMany({
      where: { destinatarioId: usuarioId },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  }

  async notificar(destinatarioId: string, tipo: string, conteudo: Record<string, unknown>) {
    const n = await this.prisma.notificacao.create({ data: { destinatarioId, tipo, conteudo: conteudo as never } });
    this.realtime.emitir(`pessoa:${destinatarioId}`, 'notificacao', n);
    return n;
  }

  @OnEvent(EVENTOS.MENCAO_CRIADA)
  aoMencionar(e: MencaoCriadaEvento) {
    if (e.tipo !== TipoMencao.USUARIO) return; // notifica a pessoa marcada
    return this.notificar(e.alvoId, 'mencao', { mensagemId: e.mensagemId, autorId: e.autorId, trecho: e.trecho });
  }

  @OnEvent(EVENTOS.TAREFA_ATRIBUIDA)
  aoAtribuir(e: TarefaAtribuidaEvento) {
    return this.notificar(e.responsavelId, 'tarefa', { tarefaId: e.tarefaId, boardId: e.boardId });
  }

  // Lembrete de evento: notifica cada participante in-app (sino).
  @OnEvent(EVENTOS.LEMBRETE_DISPARADO)
  async aoDispararLembrete(e: LembreteDisparadoEvento) {
    await Promise.all(
      e.participantesIds.map((destinatarioId) =>
        this.notificar(destinatarioId, 'lembrete', {
          eventoId: e.eventoId,
          titulo: e.titulo,
          ocorrenciaInicio: e.ocorrenciaInicio,
        }),
      ),
    );
  }
}

@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
class NotificacoesController {
  constructor(private readonly notif: NotificacoesService) {}
  @Get('minhas')
  minhas(@UsuarioAtual() u: UsuarioAutenticado) {
    return this.notif.minhas(u.id);
  }
}

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
