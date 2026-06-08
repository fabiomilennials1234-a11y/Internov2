import { EVENTOS, TipoAtividade } from '@interno/shared';
import { descreverAtividade } from './descritor-atividade';

describe('descreverAtividade', () => {
  it('descreve mudança de Saúde como atividade no card (ator + alvo)', () => {
    const item = descreverAtividade(EVENTOS.CLIENTE_SAUDE_ALTERADA, {
      clienteId: 'c1',
      saude: 'RISCO',
      atorId: 'u1',
    });
    expect(item).toEqual({
      tipo: TipoAtividade.SAUDE_CLIENTE,
      atorId: 'u1',
      clienteId: 'c1',
      resumo: 'Saúde → Risco',
      payload: { saude: 'RISCO' },
    });
  });

  it('descreve mudança de Estágio de entrega', () => {
    const item = descreverAtividade(EVENTOS.CLIENTE_ESTAGIO_ALTERADO, {
      clienteId: 'c1',
      estagio: 'EM_EXECUCAO',
      atorId: 'u1',
    });
    expect(item).toEqual({
      tipo: TipoAtividade.ESTAGIO_CLIENTE,
      atorId: 'u1',
      clienteId: 'c1',
      resumo: 'Estágio → Em execução',
      payload: { estagio: 'EM_EXECUCAO' },
    });
  });

  it('descreve criação do Cliente', () => {
    const item = descreverAtividade(EVENTOS.CLIENTE_CRIADO, {
      clienteId: 'c1',
      nome: 'AgroVerde',
      atorId: 'u1',
    });
    expect(item).toEqual({
      tipo: TipoAtividade.CLIENTE,
      atorId: 'u1',
      clienteId: 'c1',
      resumo: 'Cliente criado',
      payload: undefined,
    });
  });

  it('descreve edição do Cliente listando os campos alterados', () => {
    const item = descreverAtividade(EVENTOS.CLIENTE_ATUALIZADO, {
      clienteId: 'c1',
      atorId: 'u1',
      campos: ['nome', 'valorMensal'],
    });
    expect(item).toEqual({
      tipo: TipoAtividade.CLIENTE,
      atorId: 'u1',
      clienteId: 'c1',
      resumo: 'Dados atualizados: nome, valorMensal',
      payload: { campos: ['nome', 'valorMensal'] },
    });
  });

  it('ignora edição sem campos alterados', () => {
    expect(
      descreverAtividade(EVENTOS.CLIENTE_ATUALIZADO, { clienteId: 'c1', atorId: 'u1', campos: [] }),
    ).toBeNull();
  });

  it('ignora evento que não entra no card', () => {
    expect(descreverAtividade('evento.qualquer', {})).toBeNull();
  });
});
