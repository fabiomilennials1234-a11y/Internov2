import { StatusFrente } from '@interno/shared';

// Máquina de estados da Frente (deep module puro). Fonte única das transições
// válidas — usada pela API (rejeita transição inválida) e pela UI (oferece só
// os próximos status). PLANEJADA → ATIVA → (PAUSADA ↔ ATIVA) → CONCLUIDA;
// CONCLUIDA pode reabrir para ATIVA. Mesmo-status é no-op (proibido).
const TRANSICOES: Record<StatusFrente, StatusFrente[]> = {
  PLANEJADA: ['ATIVA'],
  ATIVA: ['PAUSADA', 'CONCLUIDA'],
  PAUSADA: ['ATIVA', 'CONCLUIDA'],
  CONCLUIDA: ['ATIVA'],
};

export function proximosStatus(de: StatusFrente): StatusFrente[] {
  return TRANSICOES[de] ?? [];
}

export function transicaoPermitida(de: StatusFrente, para: StatusFrente): boolean {
  return proximosStatus(de).includes(para);
}
