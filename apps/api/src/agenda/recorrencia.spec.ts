import { expandirOcorrencias } from './recorrencia';

// Datas em UTC — expansão é em UTC; render BR é do frontend.
const d = (iso: string) => new Date(iso);

describe('expandirOcorrencias', () => {
  describe('evento único (sem rrule)', () => {
    it('retorna a ocorrência quando dentro da janela, com dataOriginal = início', () => {
      const out = expandirOcorrencias(
        { inicio: d('2026-06-10T13:00:00Z'), fim: d('2026-06-10T14:00:00Z'), rrule: null },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-15T00:00:00Z') },
      );
      expect(out).toEqual([
        { inicio: d('2026-06-10T13:00:00Z'), fim: d('2026-06-10T14:00:00Z'), dataOriginal: d('2026-06-10T13:00:00Z') },
      ]);
    });

    it('retorna vazio quando fora da janela', () => {
      const out = expandirOcorrencias(
        { inicio: d('2026-07-10T13:00:00Z'), fim: d('2026-07-10T14:00:00Z'), rrule: null },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-15T00:00:00Z') },
      );
      expect(out).toEqual([]);
    });
  });

  describe('série recorrente', () => {
    it('expande semanal preservando a duração, só dentro da janela', () => {
      const out = expandirOcorrencias(
        { inicio: d('2026-06-01T13:00:00Z'), fim: d('2026-06-01T14:00:00Z'), rrule: 'FREQ=WEEKLY' },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-22T00:00:00Z') },
      );
      expect(out.map((o) => o.inicio.toISOString())).toEqual([
        '2026-06-08T13:00:00.000Z',
        '2026-06-15T13:00:00.000Z',
      ]);
      expect(out[0].fim.toISOString()).toBe('2026-06-08T14:00:00.000Z');
    });

    it('respeita recorrenciaFim (UNTIL implícito)', () => {
      const out = expandirOcorrencias(
        {
          inicio: d('2026-06-01T13:00:00Z'),
          fim: d('2026-06-01T14:00:00Z'),
          rrule: 'FREQ=WEEKLY',
          recorrenciaFim: d('2026-06-10T00:00:00Z'),
        },
        { de: d('2026-06-01T00:00:00Z'), ate: d('2026-07-01T00:00:00Z') },
      );
      expect(out.map((o) => o.inicio.toISOString())).toEqual([
        '2026-06-01T13:00:00.000Z',
        '2026-06-08T13:00:00.000Z',
      ]);
    });

    it('expande múltiplos dias da semana (BYDAY)', () => {
      const out = expandirOcorrencias(
        { inicio: d('2026-06-08T13:00:00Z'), fim: d('2026-06-08T14:00:00Z'), rrule: 'FREQ=WEEKLY;BYDAY=MO,WE' },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-15T00:00:00Z') },
      );
      expect(out.map((o) => o.inicio.toISOString())).toEqual([
        '2026-06-08T13:00:00.000Z',
        '2026-06-10T13:00:00.000Z',
      ]);
    });
  });

  describe('exceções', () => {
    it('remove ocorrência cancelada', () => {
      const out = expandirOcorrencias(
        {
          inicio: d('2026-06-01T13:00:00Z'),
          fim: d('2026-06-01T14:00:00Z'),
          rrule: 'FREQ=WEEKLY',
          excecoes: [{ dataOriginal: d('2026-06-15T13:00:00Z'), cancelado: true }],
        },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-22T00:00:00Z') },
      );
      expect(out.map((o) => o.inicio.toISOString())).toEqual(['2026-06-08T13:00:00.000Z']);
    });

    it('aplica override de horário mantendo dataOriginal', () => {
      // ocorrência de 15/jun movida de 13h para 16h
      const out = expandirOcorrencias(
        {
          inicio: d('2026-06-01T13:00:00Z'),
          fim: d('2026-06-01T14:00:00Z'),
          rrule: 'FREQ=WEEKLY',
          excecoes: [
            { dataOriginal: d('2026-06-15T13:00:00Z'), cancelado: false, inicioOverride: d('2026-06-15T16:00:00Z'), fimOverride: d('2026-06-15T17:00:00Z') },
          ],
        },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-22T00:00:00Z') },
      );
      expect(out).toEqual([
        { inicio: d('2026-06-08T13:00:00Z'), fim: d('2026-06-08T14:00:00Z'), dataOriginal: d('2026-06-08T13:00:00Z') },
        { inicio: d('2026-06-15T16:00:00Z'), fim: d('2026-06-15T17:00:00Z'), dataOriginal: d('2026-06-15T13:00:00Z') },
      ]);
    });

    it('override sem fimOverride preserva a duração original', () => {
      const out = expandirOcorrencias(
        {
          inicio: d('2026-06-01T13:00:00Z'),
          fim: d('2026-06-01T14:30:00Z'), // 1h30
          rrule: 'FREQ=WEEKLY',
          excecoes: [{ dataOriginal: d('2026-06-08T13:00:00Z'), cancelado: false, inicioOverride: d('2026-06-08T09:00:00Z') }],
        },
        { de: d('2026-06-08T00:00:00Z'), ate: d('2026-06-09T00:00:00Z') },
      );
      expect(out).toEqual([
        { inicio: d('2026-06-08T09:00:00Z'), fim: d('2026-06-08T10:30:00Z'), dataOriginal: d('2026-06-08T13:00:00Z') },
      ]);
    });
  });
});
