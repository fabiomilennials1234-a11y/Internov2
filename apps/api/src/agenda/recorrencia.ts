import { RRule } from 'rrule';

export interface DefinicaoEvento {
  inicio: Date;
  fim: Date;
  /** Regra RRULE (RFC 5545) sem DTSTART, ex. 'FREQ=WEEKLY;BYDAY=MO,WE'. null = evento único. */
  rrule?: string | null;
  /** Limite da série (UNTIL). Aplicado por cima do RRULE. */
  recorrenciaFim?: Date | null;
  /** Inícios de ocorrências canceladas via ExcecaoEvento (dataOriginal). */
  excecoesCanceladas?: Date[];
}

export interface Ocorrencia {
  inicio: Date;
  fim: Date;
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
      return [{ inicio: evento.inicio, fim: evento.fim }];
    }
    return [];
  }

  const opcoes = RRule.parseString(evento.rrule);
  opcoes.dtstart = evento.inicio;
  if (evento.recorrenciaFim) opcoes.until = evento.recorrenciaFim;
  const regra = new RRule(opcoes);

  const cancelados = new Set((evento.excecoesCanceladas ?? []).map((d) => d.getTime()));

  // between() é exclusivo no fim; usamos inc=true no início e filtramos < ate.
  return regra
    .between(janela.de, janela.ate, true)
    .filter((inicio) => inicio >= janela.de && inicio < janela.ate)
    .filter((inicio) => !cancelados.has(inicio.getTime()))
    .map((inicio) => ({ inicio, fim: new Date(inicio.getTime() + duracaoMs) }));
}
