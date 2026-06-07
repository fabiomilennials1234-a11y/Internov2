"use strict";
// Enums de domínio — fonte única, espelhada no schema.prisma.
// Mantém TS e banco alinhados sem um módulo importar entities do outro.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoMacro = exports.TipoAtividade = exports.FonteKpi = exports.TipoDono = exports.NivelIndicador = exports.TipoMencao = exports.TipoCanal = exports.TipoFrente = exports.TipoProjeto = exports.SaudeCliente = exports.EstagioEntrega = exports.Papel = void 0;
var Papel;
(function (Papel) {
    Papel["CEO"] = "CEO";
    Papel["DIRETOR"] = "DIRETOR";
    Papel["GESTOR"] = "GESTOR";
    Papel["FUNCIONARIO"] = "FUNCIONARIO";
})(Papel || (exports.Papel = Papel = {}));
// Estágio de ENTREGA do cliente (pós-venda, "da porta p/ dentro").
var EstagioEntrega;
(function (EstagioEntrega) {
    EstagioEntrega["ONBOARDING"] = "ONBOARDING";
    EstagioEntrega["EM_EXECUCAO"] = "EM_EXECUCAO";
    EstagioEntrega["EM_REVISAO"] = "EM_REVISAO";
    EstagioEntrega["SAUDAVEL"] = "SAUDAVEL";
    EstagioEntrega["EM_RISCO"] = "EM_RISCO";
})(EstagioEntrega || (exports.EstagioEntrega = EstagioEntrega = {}));
var SaudeCliente;
(function (SaudeCliente) {
    SaudeCliente["BOA"] = "BOA";
    SaudeCliente["ATENCAO"] = "ATENCAO";
    SaudeCliente["RISCO"] = "RISCO";
})(SaudeCliente || (exports.SaudeCliente = SaudeCliente = {}));
var TipoProjeto;
(function (TipoProjeto) {
    TipoProjeto["CLIENTE"] = "CLIENTE";
    TipoProjeto["INTERNO"] = "INTERNO";
})(TipoProjeto || (exports.TipoProjeto = TipoProjeto = {}));
// Frente de trabalho do cliente (agência mkt + CRM + consultoria vendas).
var TipoFrente;
(function (TipoFrente) {
    TipoFrente["MARKETING"] = "MARKETING";
    TipoFrente["CRM"] = "CRM";
    TipoFrente["VENDAS"] = "VENDAS";
    TipoFrente["OUTRO"] = "OUTRO";
})(TipoFrente || (exports.TipoFrente = TipoFrente = {}));
var TipoCanal;
(function (TipoCanal) {
    TipoCanal["MURAL"] = "MURAL";
    TipoCanal["CANAL"] = "CANAL";
    TipoCanal["DM"] = "DM";
})(TipoCanal || (exports.TipoCanal = TipoCanal = {}));
var TipoMencao;
(function (TipoMencao) {
    TipoMencao["USUARIO"] = "USUARIO";
    TipoMencao["CLIENTE"] = "CLIENTE";
})(TipoMencao || (exports.TipoMencao = TipoMencao = {}));
var NivelIndicador;
(function (NivelIndicador) {
    NivelIndicador["MACRO"] = "MACRO";
    NivelIndicador["MICRO"] = "MICRO";
})(NivelIndicador || (exports.NivelIndicador = NivelIndicador = {}));
var TipoDono;
(function (TipoDono) {
    TipoDono["EMPRESA"] = "EMPRESA";
    TipoDono["AREA"] = "AREA";
    TipoDono["PESSOA"] = "PESSOA";
    TipoDono["CLIENTE"] = "CLIENTE";
})(TipoDono || (exports.TipoDono = TipoDono = {}));
// Indicadores começam derivados do próprio sistema (decisão do CTO).
var FonteKpi;
(function (FonteKpi) {
    FonteKpi["DERIVADO"] = "DERIVADO";
    FonteKpi["MANUAL"] = "MANUAL";
    FonteKpi["INTEGRACAO"] = "INTEGRACAO";
})(FonteKpi || (exports.FonteKpi = FonteKpi = {}));
var TipoAtividade;
(function (TipoAtividade) {
    TipoAtividade["MENCAO"] = "MENCAO";
    TipoAtividade["MENSAGEM"] = "MENSAGEM";
    TipoAtividade["TAREFA"] = "TAREFA";
    TipoAtividade["EVENTO"] = "EVENTO";
    TipoAtividade["KPI"] = "KPI";
    TipoAtividade["ESTAGIO_CLIENTE"] = "ESTAGIO_CLIENTE";
    TipoAtividade["PROJETO"] = "PROJETO";
})(TipoAtividade || (exports.TipoAtividade = TipoAtividade = {}));
var TipoMacro;
(function (TipoMacro) {
    TipoMacro["TEMPLATE_MSG"] = "TEMPLATE_MSG";
    TipoMacro["ACAO_RAPIDA"] = "ACAO_RAPIDA";
    TipoMacro["AUTOMACAO"] = "AUTOMACAO";
})(TipoMacro || (exports.TipoMacro = TipoMacro = {}));
//# sourceMappingURL=dominio.js.map