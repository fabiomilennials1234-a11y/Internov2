import {
  EVENTOS,
  TipoAtividade,
  AtividadeFeedItem,
  ClienteSaudeAlteradaEvento,
  ClienteEstagioAlteradoEvento,
  ClienteCriadoEvento,
  ClienteAtualizadoEvento,
  ProjetoVinculadoClienteEvento,
  FrenteStatusAlteradoEvento,
} from '@interno/shared';

const ROTULO_SAUDE: Record<string, string> = { BOA: 'Boa', ATENCAO: 'Atenção', RISCO: 'Risco' };
const ROTULO_ESTAGIO: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  EM_EXECUCAO: 'Em execução',
  EM_REVISAO: 'Em revisão',
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
};
const ROTULO_FRENTE: Record<string, string> = {
  MARKETING: 'Marketing',
  CRM: 'CRM',
  VENDAS: 'Vendas',
  OUTRO: 'Outro',
};
const ROTULO_STATUS_FRENTE: Record<string, string> = {
  PLANEJADA: 'Planejada',
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  CONCLUIDA: 'Concluída',
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
    case EVENTOS.CLIENTE_CRIADO: {
      const ev = e as ClienteCriadoEvento;
      return {
        tipo: TipoAtividade.CLIENTE,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        resumo: 'Cliente criado',
        payload: undefined,
      };
    }
    case EVENTOS.CLIENTE_ATUALIZADO: {
      const ev = e as ClienteAtualizadoEvento;
      if (!ev.campos.length) return null; // nada mudou → não polui o feed
      return {
        tipo: TipoAtividade.CLIENTE,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        resumo: `Dados atualizados: ${ev.campos.join(', ')}`,
        payload: { campos: ev.campos },
      };
    }
    case EVENTOS.PROJETO_VINCULADO_CLIENTE: {
      const ev = e as ProjetoVinculadoClienteEvento;
      return {
        tipo: TipoAtividade.PROJETO,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        projetoId: ev.projetoId,
        resumo: `Frente criada: ${ev.nome} (${ROTULO_FRENTE[ev.frente] ?? ev.frente})`,
        payload: { frente: ev.frente },
      };
    }
    case EVENTOS.FRENTE_STATUS_ALTERADO: {
      const ev = e as FrenteStatusAlteradoEvento;
      return {
        tipo: TipoAtividade.PROJETO,
        atorId: ev.atorId,
        clienteId: ev.clienteId,
        projetoId: ev.projetoId,
        resumo: `Frente «${ev.nome}» → ${ROTULO_STATUS_FRENTE[ev.status] ?? ev.status}`,
        payload: { status: ev.status },
      };
    }
    default:
      return null;
  }
}
