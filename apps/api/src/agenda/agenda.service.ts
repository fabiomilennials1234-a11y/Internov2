import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EVENTOS, StatusParticipante, type EventoCriadoEvento, type RsvpRespondidoEvento } from '@interno/shared';
import { PrismaService } from '../prisma';
import { expandirOcorrencias, type DefinicaoEvento } from './recorrencia';
import { calcularDispararEm } from './lembrete';
import { podeGerenciarEvento } from './permissao';

export const FILA_AGENDA = 'agenda';
export const JOB_LEMBRETE = 'lembrete-unico';
export const JOB_SWEEP = 'sweep-recorrentes';

export interface EntradaEvento {
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  inicio: Date;
  fim: Date;
  diaInteiro?: boolean;
  rrule?: string | null;
  recorrenciaFim?: Date | null;
  clienteId?: string | null;
  participantes?: string[];
  /** Presets de lembrete em minutos antes do início (ex. [10, 1440]). */
  lembretes?: number[];
}

@Injectable()
export class AgendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
    @InjectQueue(FILA_AGENDA) private readonly fila: Queue,
  ) {}

  // Diretoria vê a agenda de todos por padrão (filtro por usuário é opcional).
  // Expande séries recorrentes na janela e aplica exceções. Cada item é uma OCORRÊNCIA.
  async ocorrencias(de: Date, ate: Date, usuarioId?: string) {
    const eventos = await this.prisma.eventoAgenda.findMany({
      where: {
        OR: [
          { rrule: null, inicio: { gte: de, lt: ate } },
          { rrule: { not: null }, inicio: { lt: ate }, OR: [{ recorrenciaFim: null }, { recorrenciaFim: { gte: de } }] },
        ],
        ...(usuarioId ? { participantes: { some: { usuarioId } } } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        participantes: { include: { usuario: { select: { id: true, nome: true, avatarCor: true } } } },
        excecoes: true,
        lembretes: { select: { id: true, minutosAntes: true } },
      },
    });

    const itens = eventos.flatMap((e) => {
      const def: DefinicaoEvento = {
        inicio: e.inicio,
        fim: e.fim,
        rrule: e.rrule,
        recorrenciaFim: e.recorrenciaFim,
        excecoes: e.excecoes.map((x) => ({
          dataOriginal: x.dataOriginal,
          cancelado: x.cancelado,
          inicioOverride: x.inicioOverride,
          fimOverride: x.fimOverride,
        })),
      };
      // override de conteúdo (título/local/notas/dia-inteiro) por dataOriginal — o expansor só trata tempo.
      const overridePorData = new Map(e.excecoes.filter((x) => !x.cancelado).map((x) => [x.dataOriginal.getTime(), x]));

      return expandirOcorrencias(def, { de, ate }).map((oc) => {
        const ov = overridePorData.get(oc.dataOriginal.getTime());
        return {
          id: e.id,
          ocorrenciaInicio: oc.dataOriginal, // chave estável da ocorrência (antes de override de horário)
          inicio: oc.inicio,
          fim: oc.fim,
          titulo: ov?.tituloOverride ?? e.titulo,
          descricao: ov?.descricaoOverride ?? e.descricao,
          local: ov?.localOverride ?? e.local,
          diaInteiro: ov?.diaInteiroOverride ?? e.diaInteiro,
          editado: ov != null,
          recorrente: e.rrule != null,
          rrule: e.rrule,
          criadorId: e.criadorId,
          cliente: e.cliente,
          participantes: e.participantes,
          lembretes: e.lembretes,
        };
      });
    });

    itens.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    return itens;
  }

  async criar(input: EntradaEvento & { criadorId: string }) {
    const evento = await this.prisma.eventoAgenda.create({
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        local: input.local,
        inicio: input.inicio,
        fim: input.fim,
        diaInteiro: input.diaInteiro ?? false,
        rrule: input.rrule,
        recorrenciaFim: input.recorrenciaFim,
        criadorId: input.criadorId,
        clienteId: input.clienteId,
        participantes: { create: (input.participantes ?? [input.criadorId]).map((usuarioId) => ({ usuarioId })) },
        lembretes: { create: (input.lembretes ?? []).map((minutosAntes) => ({ minutosAntes })) },
      },
      include: { lembretes: true },
    });

    this.emitirCriado(evento);
    await this.agendarLembretesUnicos(evento);
    return evento;
  }

  async editar(id: string, usuario: { id: string; papel: string }, input: EntradaEvento) {
    const atual = await this.prisma.eventoAgenda.findUnique({ where: { id }, include: { lembretes: true } });
    if (!atual) throw new NotFoundException('Evento não encontrado');
    if (!podeGerenciarEvento(usuario, atual)) throw new ForbiddenException('Sem permissão para editar este evento');

    await this.removerLembretesUnicos(atual);

    const evento = await this.prisma.eventoAgenda.update({
      where: { id },
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        local: input.local,
        inicio: input.inicio,
        fim: input.fim,
        diaInteiro: input.diaInteiro ?? false,
        rrule: input.rrule,
        recorrenciaFim: input.recorrenciaFim,
        clienteId: input.clienteId,
        participantes: { deleteMany: {}, create: (input.participantes ?? [usuario.id]).map((usuarioId) => ({ usuarioId })) },
        lembretes: { deleteMany: {}, create: (input.lembretes ?? []).map((minutosAntes) => ({ minutosAntes })) },
      },
      include: { lembretes: true },
    });

    await this.agendarLembretesUnicos(evento);
    return evento;
  }

  async excluir(id: string, usuario: { id: string; papel: string }) {
    const atual = await this.prisma.eventoAgenda.findUnique({ where: { id }, include: { lembretes: true } });
    if (!atual) throw new NotFoundException('Evento não encontrado');
    if (!podeGerenciarEvento(usuario, atual)) throw new ForbiddenException('Sem permissão para excluir este evento');

    await this.removerLembretesUnicos(atual);
    await this.prisma.eventoAgenda.delete({ where: { id } }); // cascade: participantes, lembretes, exceções
    return { ok: true };
  }

  // Cancela UMA ocorrência de uma série recorrente (sem afetar o resto).
  async cancelarOcorrencia(id: string, usuario: { id: string; papel: string }, dataOriginal: Date) {
    const atual = await this.prisma.eventoAgenda.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Evento não encontrado');
    if (!podeGerenciarEvento(usuario, atual)) throw new ForbiddenException('Sem permissão');

    await this.prisma.excecaoEvento.upsert({
      where: { eventoId_dataOriginal: { eventoId: id, dataOriginal } },
      create: { eventoId: id, dataOriginal, cancelado: true },
      update: { cancelado: true },
    });
    return { ok: true };
  }

  // Edita UMA ocorrência de série recorrente (override de conteúdo/horário), sem afetar o resto.
  async editarOcorrencia(
    id: string,
    usuario: { id: string; papel: string },
    dataOriginal: Date,
    override: { titulo?: string; descricao?: string | null; local?: string | null; inicio?: Date; fim?: Date; diaInteiro?: boolean },
  ) {
    const atual = await this.prisma.eventoAgenda.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Evento não encontrado');
    if (!podeGerenciarEvento(usuario, atual)) throw new ForbiddenException('Sem permissão');

    const dados = {
      cancelado: false,
      tituloOverride: override.titulo ?? null,
      descricaoOverride: override.descricao ?? null,
      localOverride: override.local ?? null,
      inicioOverride: override.inicio ?? null,
      fimOverride: override.fim ?? null,
      diaInteiroOverride: override.diaInteiro ?? null,
    };
    await this.prisma.excecaoEvento.upsert({
      where: { eventoId_dataOriginal: { eventoId: id, dataOriginal } },
      create: { eventoId: id, dataOriginal, ...dados },
      update: dados,
    });
    return { ok: true };
  }

  // RSVP (fase 2): participante responde ao convite. Status vale para a série inteira.
  async responder(eventoId: string, usuarioId: string, status: StatusParticipante) {
    const participante = await this.prisma.participanteEvento.update({
      where: { eventoId_usuarioId: { eventoId, usuarioId } },
      data: { status },
      include: { evento: { select: { titulo: true, criadorId: true } } },
    });
    const payload: RsvpRespondidoEvento = {
      eventoId,
      titulo: participante.evento.titulo,
      criadorId: participante.evento.criadorId,
      participanteId: usuarioId,
      status,
    };
    this.eventos.emit(EVENTOS.RSVP_RESPONDIDO, payload);
    return { status };
  }

  // ─── Lembretes de evento ÚNICO: jobs delayed precisos. Recorrentes ficam com o sweeper. ───

  private jobIdLembrete(lembreteId: string, ocorrenciaInicio: Date) {
    return `lembrete:${lembreteId}:${ocorrenciaInicio.toISOString()}`;
  }

  private async agendarLembretesUnicos(evento: { id: string; titulo: string; inicio: Date; rrule: string | null; lembretes: { id: string; minutosAntes: number }[] }) {
    if (evento.rrule) return; // recorrente é tratado pelo sweeper
    const agora = Date.now();
    for (const lembrete of evento.lembretes) {
      const dispararEm = calcularDispararEm(evento.inicio, lembrete.minutosAntes);
      const delay = dispararEm.getTime() - agora;
      if (delay <= 0) continue; // já passou
      await this.fila.add(
        JOB_LEMBRETE,
        { lembreteId: lembrete.id, eventoId: evento.id, ocorrenciaInicio: evento.inicio.toISOString() },
        { delay, jobId: this.jobIdLembrete(lembrete.id, evento.inicio), removeOnComplete: true, removeOnFail: true },
      );
    }
  }

  private async removerLembretesUnicos(evento: { inicio: Date; lembretes: { id: string }[] }) {
    for (const lembrete of evento.lembretes) {
      await this.fila.remove(this.jobIdLembrete(lembrete.id, evento.inicio)).catch(() => undefined);
    }
  }

  private emitirCriado(evento: { id: string; criadorId: string; clienteId: string | null; titulo: string; inicio: Date }) {
    const payload: EventoCriadoEvento = {
      eventoId: evento.id,
      criadorId: evento.criadorId,
      clienteId: evento.clienteId,
      titulo: evento.titulo,
      inicio: evento.inicio.toISOString(),
    };
    this.eventos.emit(EVENTOS.EVENTO_CRIADO, payload);
  }
}
