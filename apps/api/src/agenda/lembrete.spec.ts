import { calcularDispararEm, chaveDisparo, lembretesDevidos, type EventoComLembretes } from './lembrete';

const d = (iso: string) => new Date(iso);

describe('calcularDispararEm', () => {
  it('subtrai os minutos do início da ocorrência', () => {
    expect(calcularDispararEm(d('2026-06-10T13:00:00Z'), 10).toISOString()).toBe('2026-06-10T12:50:00.000Z');
  });
});

describe('lembretesDevidos', () => {
  const janela = { de: d('2026-06-10T12:45:00Z'), ate: d('2026-06-10T12:55:00Z') };

  it('inclui o disparo de evento único cujo dispararEm cai na janela de varredura', () => {
    const eventos: EventoComLembretes[] = [
      {
        eventoId: 'e1',
        inicio: d('2026-06-10T13:00:00Z'),
        fim: d('2026-06-10T14:00:00Z'),
        rrule: null,
        lembretes: [{ id: 'l1', minutosAntes: 10 }], // dispararEm = 12:50 ∈ janela
      },
    ];
    const out = lembretesDevidos(eventos, janela, new Set());
    expect(out).toEqual([{ lembreteId: 'l1', eventoId: 'e1', ocorrenciaInicio: d('2026-06-10T13:00:00Z') }]);
  });

  it('exclui disparo cujo dispararEm está fora da janela', () => {
    const eventos: EventoComLembretes[] = [
      {
        eventoId: 'e1',
        inicio: d('2026-06-10T13:00:00Z'),
        fim: d('2026-06-10T14:00:00Z'),
        rrule: null,
        lembretes: [{ id: 'l1', minutosAntes: 60 }], // dispararEm = 12:00, fora
      },
    ];
    expect(lembretesDevidos(eventos, janela, new Set())).toEqual([]);
  });

  it('exclui disparo já registrado no ledger (idempotência)', () => {
    const eventos: EventoComLembretes[] = [
      {
        eventoId: 'e1',
        inicio: d('2026-06-10T13:00:00Z'),
        fim: d('2026-06-10T14:00:00Z'),
        rrule: null,
        lembretes: [{ id: 'l1', minutosAntes: 10 }],
      },
    ];
    const ledger = new Set([chaveDisparo('l1', d('2026-06-10T13:00:00Z'))]);
    expect(lembretesDevidos(eventos, janela, ledger)).toEqual([]);
  });

  it('dispara para a ocorrência recorrente certa dentro da varredura', () => {
    // semanal às quartas 13h; varredura mira a quarta 2026-06-17
    const eventos: EventoComLembretes[] = [
      {
        eventoId: 'e1',
        inicio: d('2026-06-10T13:00:00Z'), // quarta
        fim: d('2026-06-10T14:00:00Z'),
        rrule: 'FREQ=WEEKLY',
        lembretes: [{ id: 'l1', minutosAntes: 10 }],
      },
    ];
    const varreduraProxQuarta = { de: d('2026-06-17T12:45:00Z'), ate: d('2026-06-17T12:55:00Z') };
    const out = lembretesDevidos(eventos, varreduraProxQuarta, new Set());
    expect(out).toEqual([{ lembreteId: 'l1', eventoId: 'e1', ocorrenciaInicio: d('2026-06-17T13:00:00Z') }]);
  });
});
