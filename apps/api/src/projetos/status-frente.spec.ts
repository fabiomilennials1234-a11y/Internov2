import { transicaoPermitida, proximosStatus } from './status-frente';

describe('transições de Status da Frente', () => {
  it('permite Planejada → Ativa', () => {
    expect(transicaoPermitida('PLANEJADA', 'ATIVA')).toBe(true);
  });

  it('permite Ativa → Pausada e Ativa → Concluída', () => {
    expect(transicaoPermitida('ATIVA', 'PAUSADA')).toBe(true);
    expect(transicaoPermitida('ATIVA', 'CONCLUIDA')).toBe(true);
  });

  it('permite reabrir Concluída → Ativa', () => {
    expect(transicaoPermitida('CONCLUIDA', 'ATIVA')).toBe(true);
  });

  it('proíbe pular Planejada → Concluída', () => {
    expect(transicaoPermitida('PLANEJADA', 'CONCLUIDA')).toBe(false);
  });

  it('proíbe Pausada → Planejada (não volta a planejar)', () => {
    expect(transicaoPermitida('PAUSADA', 'PLANEJADA')).toBe(false);
  });

  it('proíbe transição para o mesmo status (no-op)', () => {
    expect(transicaoPermitida('ATIVA', 'ATIVA')).toBe(false);
  });

  it('lista os próximos status válidos a partir de um status', () => {
    expect(proximosStatus('ATIVA').sort()).toEqual(['CONCLUIDA', 'PAUSADA']);
    expect(proximosStatus('CONCLUIDA')).toEqual(['ATIVA']);
  });
});
