import { expandirOcorrencias, type DefinicaoEvento, type Janela } from './recorrencia';

export function calcularDispararEm(ocorrenciaInicio: Date, minutosAntes: number): Date {
  return new Date(ocorrenciaInicio.getTime() - minutosAntes * 60_000);
}

export function chaveDisparo(lembreteId: string, ocorrenciaInicio: Date): string {
  return `${lembreteId}|${ocorrenciaInicio.toISOString()}`;
}

export interface EventoComLembretes extends DefinicaoEvento {
  eventoId: string;
  lembretes: { id: string; minutosAntes: number }[];
}

export interface DisparoDevido {
  lembreteId: string;
  eventoId: string;
  ocorrenciaInicio: Date;
}

/**
 * Decide quais lembretes devem disparar numa varredura: aqueles cujo dispararEm cai
 * em [janela.de, janela.ate) e que ainda não constam no ledger. Função pura — o Processor
 * envolve Prisma + emit em volta. Idempotente via `jaEnviados`.
 */
export function lembretesDevidos(
  eventos: EventoComLembretes[],
  janela: Janela,
  jaEnviados: Set<string>,
): DisparoDevido[] {
  const devidos: DisparoDevido[] = [];
  for (const evento of eventos) {
    for (const lembrete of evento.lembretes) {
      const leadMs = lembrete.minutosAntes * 60_000;
      // dispararEm ∈ [de, ate) ⟺ ocorrenciaInicio ∈ [de+lead, ate+lead)
      const janelaOcorrencia: Janela = {
        de: new Date(janela.de.getTime() + leadMs),
        ate: new Date(janela.ate.getTime() + leadMs),
      };
      for (const ocorrencia of expandirOcorrencias(evento, janelaOcorrencia)) {
        const chave = chaveDisparo(lembrete.id, ocorrencia.inicio);
        if (jaEnviados.has(chave)) continue;
        devidos.push({ lembreteId: lembrete.id, eventoId: evento.eventoId, ocorrenciaInicio: ocorrencia.inicio });
      }
    }
  }
  return devidos;
}
