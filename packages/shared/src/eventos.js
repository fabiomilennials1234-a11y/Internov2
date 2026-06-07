"use strict";
// Contratos de eventos de domínio (event bus IN-PROCESS via @nestjs/event-emitter).
// Fronteira entre módulos do monolito modular: outro módulo só conhece ESTES
// contratos + a facade pública — nunca repositórios/entities internos.
// (Galego: comunicação intra-monolito é chamada de função, não rede.)
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTOS = void 0;
exports.EVENTOS = {
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
    KPI_ATUALIZADO: 'indicadores.kpi.atualizado',
};
//# sourceMappingURL=eventos.js.map