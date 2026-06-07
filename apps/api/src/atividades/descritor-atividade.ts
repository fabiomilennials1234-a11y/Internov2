import {
  EVENTOS,
  TipoAtividade,
  AtividadeFeedItem,
  ClienteSaudeAlteradaEvento,
  ClienteEstagioAlteradoEvento,
} from '@interno/shared';

const ROTULO_SAUDE: Record<string, string> = { BOA: 'Boa', ATENCAO: 'Atenção', RISCO: 'Risco' };
const ROTULO_ESTAGIO: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  EM_EXECUCAO: 'Em execução',
  EM_REVISAO: 'Em revisão',
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
};

// Deep module: traduz um evento de domínio no item do feed (ou null se não entra no card).
// Pura — sem I/O. O listener só persiste o que esta função decide.
export function descreverAtividade(nome: string, e: unknown): AtividadeFeedItem | null {
  switch (nome) {
    case EVENTOS.CLIENTE_SAUDE_ALTERADA: {
      const ev = e as ClienteSaudeAlteradaEvento;
      return {
        tipo: TipoAtividade.SAUDE_CLIENTE,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        resumo: `Saúde → ${ROTULO_SAUDE[ev.saude] ?? ev.saude}`,
        payload: { saude: ev.saude },
      };
    }
    case EVENTOS.CLIENTE_ESTAGIO_ALTERADO: {
      const ev = e as ClienteEstagioAlteradoEvento;
      return {
        tipo: TipoAtividade.ESTAGIO_CLIENTE,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        resumo: `Estágio → ${ROTULO_ESTAGIO[ev.estagio] ?? ev.estagio}`,
        payload: { estagio: ev.estagio },
      };
    }
    default:
      return null;
  }
}
