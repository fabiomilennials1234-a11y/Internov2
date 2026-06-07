import { podeGerenciarEvento } from './permissao';

const evento = { criadorId: 'dono' };

describe('podeGerenciarEvento', () => {
  it('permite o criador', () => {
    expect(podeGerenciarEvento({ id: 'dono', papel: 'FUNCIONARIO' }, evento)).toBe(true);
  });
  it('permite CEO mesmo não sendo criador', () => {
    expect(podeGerenciarEvento({ id: 'outro', papel: 'CEO' }, evento)).toBe(true);
  });
  it('permite Diretor mesmo não sendo criador', () => {
    expect(podeGerenciarEvento({ id: 'outro', papel: 'DIRETOR' }, evento)).toBe(true);
  });
  it('nega funcionário que não criou', () => {
    expect(podeGerenciarEvento({ id: 'outro', papel: 'FUNCIONARIO' }, evento)).toBe(false);
  });
  it('nega gestor que não criou', () => {
    expect(podeGerenciarEvento({ id: 'outro', papel: 'GESTOR' }, evento)).toBe(false);
  });
});
