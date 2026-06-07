import { Injectable, type OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job, Queue } from 'bullmq';
import { EVENTOS, type LembreteDisparadoEvento } from '@interno/shared';
import { PrismaService } from '../prisma';
import { lembretesDevidos, chaveDisparo, type EventoComLembretes, type DisparoDevido } from './lembrete';
import { FILA_AGENDA, JOB_LEMBRETE, JOB_SWEEP } from './agenda.service';

const SWEEP_INTERVALO_MS = 5 * 60_000; // varre a cada 5 min
const LOOKAHEAD_MS = 90 * 60_000; // expande ocorrências até 90 min à frente (cobre lead de até 1h+ folga)

// Agenda o job repetível de varredura ao subir.
@Injectable()
export class AgendaScheduler implements OnModuleInit {
  constructor(@InjectQueue(FILA_AGENDA) private readonly fila: Queue) {}
  async onModuleInit() {
    await this.fila.add(
      JOB_SWEEP,
      {},
      { repeat: { every: SWEEP_INTERVALO_MS }, jobId: JOB_SWEEP, removeOnComplete: true, removeOnFail: 100 },
    );
  }
}

@Processor(FILA_AGENDA)
export class AgendaProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === JOB_SWEEP) return this.varrer();
    if (job.name === JOB_LEMBRETE) return this.dispararUnico(job.data);
  }

  // Evento único: job delayed preciso. Idempotente via ledger.
  private async dispararUnico(data: { lembreteId: string; eventoId: string; ocorrenciaInicio: string }) {
    await this.disparar({
      lembreteId: data.lembreteId,
      eventoId: data.eventoId,
      ocorrenciaInicio: new Date(data.ocorrenciaInicio),
    });
  }

  // Eventos recorrentes: expande ocorrências entrando na janela e dispara o que está devido.
  private async varrer() {
    const agora = Date.now();
    const janela = { de: new Date(agora - SWEEP_INTERVALO_MS), ate: new Date(agora + LOOKAHEAD_MS) };

    const eventos = await this.prisma.eventoAgenda.findMany({
      where: { rrule: { not: null }, lembretes: { some: {} } },
      include: {
        lembretes: { select: { id: true, minutosAntes: true } },
        excecoes: { where: { cancelado: true }, select: { dataOriginal: true } },
      },
    });

    const defs: EventoComLembretes[] = eventos.map((e) => ({
      eventoId: e.id,
      inicio: e.inicio,
      fim: e.fim,
      rrule: e.rrule,
      recorrenciaFim: e.recorrenciaFim,
      excecoesCanceladas: e.excecoes.map((x) => x.dataOriginal),
      lembretes: e.lembretes,
    }));

    // dispararEm devido ⟺ está em (passado recente, agora]. Limita pela janela de varredura.
    const janelaDisparo = { de: new Date(agora - SWEEP_INTERVALO_MS), ate: new Date(agora + 1000) };

    // Pré-carrega ledger das ocorrências candidatas p/ idempotência sem corrida.
    const ledger = await this.prisma.lembreteDisparado.findMany({
      where: { ocorrenciaInicio: { gte: janela.de, lte: janela.ate } },
      select: { lembreteId: true, ocorrenciaInicio: true },
    });
    const jaEnviados = new Set(ledger.map((l) => chaveDisparo(l.lembreteId, l.ocorrenciaInicio)));

    for (const devido of lembretesDevidos(defs, janelaDisparo, jaEnviados)) {
      await this.disparar(devido);
    }
  }

  // Grava no ledger (idempotente) e, se foi a primeira vez, emite o evento de domínio.
  private async disparar(devido: DisparoDevido) {
    try {
      await this.prisma.lembreteDisparado.create({
        data: { lembreteId: devido.lembreteId, ocorrenciaInicio: devido.ocorrenciaInicio },
      });
    } catch {
      return; // unique(lembreteId, ocorrenciaInicio) violado = já disparou
    }

    const evento = await this.prisma.eventoAgenda.findUnique({
      where: { id: devido.eventoId },
      select: { titulo: true, participantes: { select: { usuarioId: true } } },
    });
    if (!evento) return;

    const payload: LembreteDisparadoEvento = {
      eventoId: devido.eventoId,
      lembreteId: devido.lembreteId,
      titulo: evento.titulo,
      ocorrenciaInicio: devido.ocorrenciaInicio.toISOString(),
      participantesIds: evento.participantes.map((p) => p.usuarioId),
    };
    this.eventos.emit(EVENTOS.LEMBRETE_DISPARADO, payload);
  }
}
