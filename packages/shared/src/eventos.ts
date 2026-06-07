// Contratos de eventos de domínio (event bus IN-PROCESS via @nestjs/event-emitter).
// Fronteira entre módulos do monolito modular: outro módulo só conhece ESTES
// contratos + a facade pública — nunca repositórios/entities internos.
// (Galego: comunicação intra-monolito é chamada de função, não rede.)

import { TipoMencao, EstagioEntrega, TipoAtividade, StatusParticipante } from './dominio';

export const EVENTOS = {
  USUARIO_CRIADO: 'pessoas.usuario.criado',
  AREA_CRIADA: 'pessoas.area.criada',
  CLIENTE_CRIADO: 'clientes.cliente.criado',
  CLIENTE_ESTAGIO_ALTERADO: 'clientes.estagio.alterado',
  MENCAO_CRIADA: 'comunicacao.mencao.criada',
  MENSAGEM_CRIADA: 'comunicacao.mensagem.criada',
  TAREFA_ATRIBUIDA: 'projetos.tarefa.atribuida',
  PROJETO_VINCULADO_CLIENTE: 'projetos.projeto.vinculadoCliente',
  EVENTO_CRIADO: 'agenda.evento.criado',
  LEMBRETE_DISPARADO: 'agenda.lembrete.disparado',
  RSVP_RESPONDIDO: 'agenda.rsvp.respondido',
  KPI_ATUALIZADO: 'indicadores.kpi.atualizado',
} as const;

export interface UsuarioCriadoEvento {
  usuarioId: string;
  nome: string;
  papel: string;
  areaId?: string | null;
}

export interface ClienteEstagioAlteradoEvento {
  clienteId: string;
  estagio: EstagioEntrega;
  atorId: string;
}

// Gancho central do "card universal": menção a @cliente alimenta o card.
export interface MencaoCriadaEvento {
  mencaoId: string;
  tipo: TipoMencao;
  alvoId: string; // usuarioId ou clienteId conforme `tipo`
  mensagemId: string;
  canalId: string;
  autorId: string;
  trecho: string;
}

export interface TarefaAtribuidaEvento {
  tarefaId: string;
  boardId: string;
  responsavelId: string;
  clienteId?: string | null;
}

export interface KpiAtualizadoEvento {
  kpiId: string;
  valor: number;
  donoTipo: string;
  donoId?: string | null;
}

// Evento de agenda criado. Carrega o necessário p/ o feed (cliente vinculado vira Atividade no card).
export interface EventoCriadoEvento {
  eventoId: string;
  criadorId: string;
  clienteId?: string | null;
  titulo: string;
  inicio: string; // ISO
}

// Lembrete disparou para o início de uma ocorrência: notifica os participantes in-app.
export interface LembreteDisparadoEvento {
  eventoId: string;
  lembreteId: string;
  titulo: string;
  ocorrenciaInicio: string; // ISO
  participantesIds: string[];
}

// Participante respondeu ao convite (RSVP): notifica o criador do evento.
export interface RsvpRespondidoEvento {
  eventoId: string;
  titulo: string;
  criadorId: string;
  participanteId: string;
  status: StatusParticipante;
}

// Item normalizado do feed de atividades (alimenta card do cliente E visão por pessoa).
export interface AtividadeFeedItem {
  tipo: TipoAtividade;
  atorId?: string | null; // pessoa que agiu
  clienteId?: string | null; // alvo cliente
  projetoId?: string | null;
  mensagemId?: string | null;
  eventoId?: string | null;
  resumo: string;
  payload?: Record<string, unknown>;
}
