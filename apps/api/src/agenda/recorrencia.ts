import { RRule } from 'rrule';

/** Desvio de uma ocorrência: cancelamento ou override de horário. Override de conteúdo
 * (título/local/notas) é aplicado pelo serviço por dataOriginal — aqui só o tempo importa. */
export interface ExcecaoOcorrencia {
  dataOriginal: Date;
  cancelado: boolean;
  inicioOverride?: Date | null;
  fimOverride?: Date | null;
}

export interface DefinicaoEvento {
  inicio: Date;
  fim: Date;
  /** Regra RRULE (RFC 5545) sem DTSTART, ex. 'FREQ=WEEKLY;BYDAY=MO,WE'. null = evento único. */
  rrule?: string | null;
  /** Limite da série (UNTIL). Aplicado por cima do RRULE. */
  recorrenciaFim?: Date | null;
  excecoes?: ExcecaoOcorrencia[];
}

export interface Ocorrencia {
  inicio: Date;
  fim: Date;
  /** Início da ocorrência na série antes de qualquer override — chave de exceção/cancelamento. */
  dataOriginal: Date;
}

export interface Janela {
  de: Date;
  ate: Date;
}

/**
 * Expande um evento (único ou recorrente) nas ocorrências que iniciam dentro de [de, ate].
 * Recorrência via RRULE; ocorrências não são materializadas — calculadas aqui. Ver docs/adr/0001.
 */
export function expandirOcorrencias(evento: DefinicaoEvento, janela: Janela): Ocorrencia[] {
  const duracaoMs = evento.fim.getTime() - evento.inicio.getTime();

  // Evento único: incluso se inicia dentro da janela.
  if (!evento.rrule) {
    if (evento.inicio >= janela.de && evento.inicio < janela.ate) {
      return [{ inicio: evento.inicio, fim: evento.fim, dataOriginal: evento.inicio }];
    }
    return [];
  }

  const opcoes = RRule.parseString(evento.rrule);
  opcoes.dtstart = evento.inicio;
  if (evento.recorrenciaFim) opcoes.until = evento.recorrenciaFim;
  const regra = new RRule(opcoes);

  const porData = new Map((evento.excecoes ?? []).map((e) => [e.dataOriginal.getTime(), e]));

  const ocorrencias: Ocorrencia[] = [];
  for (const slot of regra.between(janela.de, janela.ate, true)) {
    if (slot < janela.de || slot >= janela.ate) continue;
    const excecao = porData.get(slot.getTime());
    if (excecao?.cancelado) continue;

    if (excecao?.inicioOverride) {
      const inicio = excecao.inicioOverride;
      const fim = excecao.fimOverride ?? new Date(inicio.getTime() + duracaoMs);
      ocorrencias.push({ inicio, fim, dataOriginal: slot });
    } else {
      ocorrencias.push({ inicio: slot, fim: new Date(slot.getTime() + duracaoMs), dataOriginal: slot });
    }
  }
  return ocorrencias;
}
