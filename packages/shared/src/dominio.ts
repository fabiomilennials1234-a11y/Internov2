// Enums de domínio — fonte única, espelham schema.prisma.
// Padrão `as const` + union type (idêntico ao que o Prisma Client gera):
// assim os valores são assignáveis nos dois sentidos entre módulos e Prisma,
// e o objeto serve para `@IsEnum(...)` da class-validator.

export const Papel = {
  CEO: 'CEO',
  DIRETOR: 'DIRETOR',
  GESTOR: 'GESTOR',
  FUNCIONARIO: 'FUNCIONARIO',
} as const;
export type Papel = (typeof Papel)[keyof typeof Papel];

// Estágio de ENTREGA do cliente (pós-venda, "da porta p/ dentro").
export const EstagioEntrega = {
  ONBOARDING: 'ONBOARDING',
  EM_EXECUCAO: 'EM_EXECUCAO',
  EM_REVISAO: 'EM_REVISAO',
  SAUDAVEL: 'SAUDAVEL',
  EM_RISCO: 'EM_RISCO',
} as const;
export type EstagioEntrega = (typeof EstagioEntrega)[keyof typeof EstagioEntrega];

export const SaudeCliente = {
  BOA: 'BOA',
  ATENCAO: 'ATENCAO',
  RISCO: 'RISCO',
} as const;
export type SaudeCliente = (typeof SaudeCliente)[keyof typeof SaudeCliente];

export const TipoProjeto = {
  CLIENTE: 'CLIENTE',
  INTERNO: 'INTERNO',
} as const;
export type TipoProjeto = (typeof TipoProjeto)[keyof typeof TipoProjeto];

// Frente de trabalho do cliente (agência mkt + CRM + consultoria vendas).
export const TipoFrente = {
  MARKETING: 'MARKETING',
  CRM: 'CRM',
  VENDAS: 'VENDAS',
  OUTRO: 'OUTRO',
} as const;
export type TipoFrente = (typeof TipoFrente)[keyof typeof TipoFrente];

export const TipoCanal = {
  MURAL: 'MURAL',
  CANAL: 'CANAL',
  DM: 'DM',
} as const;
export type TipoCanal = (typeof TipoCanal)[keyof typeof TipoCanal];

export const TipoMencao = {
  USUARIO: 'USUARIO',
  CLIENTE: 'CLIENTE',
} as const;
export type TipoMencao = (typeof TipoMencao)[keyof typeof TipoMencao];

export const NivelIndicador = {
  MACRO: 'MACRO',
  MICRO: 'MICRO',
} as const;
export type NivelIndicador = (typeof NivelIndicador)[keyof typeof NivelIndicador];

export const TipoDono = {
  EMPRESA: 'EMPRESA',
  AREA: 'AREA',
  PESSOA: 'PESSOA',
  CLIENTE: 'CLIENTE',
} as const;
export type TipoDono = (typeof TipoDono)[keyof typeof TipoDono];

// Indicadores começam derivados do próprio sistema (decisão do CTO).
export const FonteKpi = {
  DERIVADO: 'DERIVADO',
  MANUAL: 'MANUAL',
  INTEGRACAO: 'INTEGRACAO',
} as const;
export type FonteKpi = (typeof FonteKpi)[keyof typeof FonteKpi];

export const TipoAtividade = {
  MENCAO: 'MENCAO',
  MENSAGEM: 'MENSAGEM',
  TAREFA: 'TAREFA',
  EVENTO: 'EVENTO',
  KPI: 'KPI',
  ESTAGIO_CLIENTE: 'ESTAGIO_CLIENTE',
  PROJETO: 'PROJETO',
} as const;
export type TipoAtividade = (typeof TipoAtividade)[keyof typeof TipoAtividade];

export const TipoMacro = {
  TEMPLATE_MSG: 'TEMPLATE_MSG',
  ACAO_RAPIDA: 'ACAO_RAPIDA',
  AUTOMACAO: 'AUTOMACAO',
} as const;
export type TipoMacro = (typeof TipoMacro)[keyof typeof TipoMacro];

export const StatusParticipante = {
  CONVIDADO: 'CONVIDADO',
  ACEITO: 'ACEITO',
  RECUSADO: 'RECUSADO',
  TALVEZ: 'TALVEZ',
} as const;
export type StatusParticipante = (typeof StatusParticipante)[keyof typeof StatusParticipante];
