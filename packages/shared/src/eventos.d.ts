import { TipoMencao, EstagioEntrega, TipoAtividade } from './dominio';
export declare const EVENTOS: {
    readonly USUARIO_CRIADO: "pessoas.usuario.criado";
    readonly AREA_CRIADA: "pessoas.area.criada";
    readonly CLIENTE_CRIADO: "clientes.cliente.criado";
    readonly CLIENTE_ESTAGIO_ALTERADO: "clientes.estagio.alterado";
    readonly MENCAO_CRIADA: "comunicacao.mencao.criada";
    readonly MENSAGEM_CRIADA: "comunicacao.mensagem.criada";
    readonly TAREFA_ATRIBUIDA: "projetos.tarefa.atribuida";
    readonly PROJETO_VINCULADO_CLIENTE: "projetos.projeto.vinculadoCliente";
    readonly EVENTO_CRIADO: "agenda.evento.criado";
    readonly LEMBRETE_DISPARADO: "agenda.lembrete.disparado";
    readonly KPI_ATUALIZADO: "indicadores.kpi.atualizado";
};
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
export interface MencaoCriadaEvento {
    mencaoId: string;
    tipo: TipoMencao;
    alvoId: string;
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
export interface AtividadeFeedItem {
    tipo: TipoAtividade;
    atorId?: string | null;
    clienteId?: string | null;
    projetoId?: string | null;
    mensagemId?: string | null;
    eventoId?: string | null;
    resumo: string;
    payload?: Record<string, unknown>;
}
//# sourceMappingURL=eventos.d.ts.map