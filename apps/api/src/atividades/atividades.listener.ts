import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTOS,
  MencaoCriadaEvento,
  ClienteEstagioAlteradoEvento,
  ClienteSaudeAlteradaEvento,
  TarefaAtribuidaEvento,
  EventoCriadoEvento,
  TipoAtividade,
  TipoMencao,
} from '@interno/shared';
import { AtividadesService } from './atividades.service';
import { descreverAtividade } from './descritor-atividade';

// Traduz eventos de domínio em itens do feed. Desacopla: o módulo de origem
// não conhece atividades; só emite o evento.
@Injectable()
export class AtividadesListener {
  constructor(private readonly atividades: AtividadesService) {}

  @OnEvent(EVENTOS.MENCAO_CRIADA)
  aoMencionar(e: MencaoCriadaEvento) {
    if (e.tipo !== TipoMencao.CLIENTE) return; // só @cliente entra no card
    return this.atividades.registrar({
      tipo: TipoAtividade.MENCAO,
      atorId: e.autorId,
      clienteId: e.alvoId,
      mensagemId: e.mensagemId,
      resumo: e.trecho,
      payload: { canalId: e.canalId },
    });
  }

  @OnEvent(EVENTOS.CLIENTE_ESTAGIO_ALTERADO)
  aoMudarEstagio(e: ClienteEstagioAlteradoEvento) {
    const item = descreverAtividade(EVENTOS.CLIENTE_ESTAGIO_ALTERADO, e);
    if (item) return this.atividades.registrar(item);
  }

  @OnEvent(EVENTOS.CLIENTE_SAUDE_ALTERADA)
  aoMudarSaude(e: ClienteSaudeAlteradaEvento) {
    const item = descreverAtividade(EVENTOS.CLIENTE_SAUDE_ALTERADA, e);
    if (item) return this.atividades.registrar(item);
  }

  // Evento de agenda vinculado a cliente vira histórico no card (ator=criador, alvo=cliente).
  @OnEvent(EVENTOS.EVENTO_CRIADO)
  aoCriarEvento(e: EventoCriadoEvento) {
    if (!e.clienteId) return; // só evento com cliente entra no card
    return this.atividades.registrar({
      tipo: TipoAtividade.EVENTO,
      atorId: e.criadorId,
      clienteId: e.clienteId,
      eventoId: e.eventoId,
      resumo: e.titulo,
      payload: { inicio: e.inicio },
    });
  }

  @OnEvent(EVENTOS.TAREFA_ATRIBUIDA)
  aoAtribuirTarefa(e: TarefaAtribuidaEvento) {
    return this.atividades.registrar({
      tipo: TipoAtividade.TAREFA,
      atorId: e.responsavelId,
      clienteId: e.clienteId,
      resumo: 'Tarefa atribuída',
      payload: { tarefaId: e.tarefaId, boardId: e.boardId },
    });
  }
}
