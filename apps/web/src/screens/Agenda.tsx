import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

interface Usuario { id: string; nome: string; avatarCor?: string }
interface Cliente { id: string; nome: string }
interface Ocorrencia {
  id: string;
  ocorrenciaInicio: string;
  inicio: string;
  fim: string;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  diaInteiro: boolean;
  recorrente: boolean;
  rrule?: string | null;
  criadorId: string;
  cliente?: { id: string; nome: string } | null;
  participantes: { usuario: Usuario; status?: string }[];
  lembretes: { id: string; minutosAntes: number }[];
}

type Vista = 'mes' | 'semana' | 'dia';
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DIAS_LONGO = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ALTURA_HORA = 48; // px por hora na grade
const PRESETS_LEMBRETE = [
  { label: 'Na hora', v: 0 },
  { label: '10 min', v: 10 },
  { label: '30 min', v: 30 },
  { label: '1 hora', v: 60 },
  { label: '1 dia', v: 1440 },
];
const DIAS_BYDAY = [
  { cod: 'MO', label: 'S' },
  { cod: 'TU', label: 'T' },
  { cod: 'WE', label: 'Q' },
  { cod: 'TH', label: 'Q' },
  { cod: 'FR', label: 'S' },
  { cod: 'SA', label: 'S' },
  { cod: 'SU', label: 'D' },
];

// ─── datas ───
function inicioDaSemana(base: Date) {
  const d = new Date(base);
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dia);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDias(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMeses(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function mesmodia(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function hhmm(iso: string) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function minutosDoDia(d: Date) { return d.getHours() * 60 + d.getMinutes(); }

// ─── RRULE leve ───
function construirRRule(freq: string, byday: string[], intervalo: number): string | null {
  if (freq === 'NENHUMA') return null;
  const partes: string[] = [];
  if (freq === 'DIARIA') partes.push('FREQ=DAILY');
  if (freq === 'SEMANAL') { partes.push('FREQ=WEEKLY'); if (byday.length) partes.push(`BYDAY=${byday.join(',')}`); }
  if (freq === 'MENSAL') partes.push('FREQ=MONTHLY');
  if (intervalo > 1) partes.push(`INTERVAL=${intervalo}`);
  return partes.join(';');
}
function lerRRule(rrule?: string | null) {
  if (!rrule) return { freq: 'NENHUMA', byday: [] as string[], intervalo: 1 };
  const freq = /FREQ=DAILY/.test(rrule) ? 'DIARIA' : /FREQ=WEEKLY/.test(rrule) ? 'SEMANAL' : /FREQ=MONTHLY/.test(rrule) ? 'MENSAL' : 'NENHUMA';
  const byday = (rrule.match(/BYDAY=([^;]+)/)?.[1].split(',') ?? []) as string[];
  const intervalo = parseInt(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? '1', 10);
  return { freq, byday, intervalo };
}
function rotuloRecorrencia(rrule?: string | null) {
  const { freq, intervalo } = lerRRule(rrule);
  if (freq === 'NENHUMA') return null;
  const base = freq === 'DIARIA' ? 'dia' : freq === 'SEMANAL' ? 'semana' : 'mês';
  return intervalo > 1 ? `A cada ${intervalo} ${base === 'mês' ? 'meses' : base + 's'}` : `Toda ${base === 'dia' ? 'dia' : base}`;
}

export function Agenda() {
  const qc = useQueryClient();
  const eu = useAuth((s) => s.usuario);
  const [vista, setVista] = useState<Vista>('semana');
  const [ref, setRef] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [filtro, setFiltro] = useState('');
  const [form, setForm] = useState<{ base?: Partial<Ocorrencia>; editId?: string } | null>(null);
  const [detalhe, setDetalhe] = useState<Ocorrencia | null>(null);

  // janela conforme a vista
  const { de, ate, dias } = useMemo(() => {
    if (vista === 'dia') {
      const d0 = new Date(ref); d0.setHours(0, 0, 0, 0);
      return { de: d0, ate: addDias(d0, 1), dias: [d0] };
    }
    if (vista === 'semana') {
      const ini = inicioDaSemana(ref);
      return { de: ini, ate: addDias(ini, 7), dias: Array.from({ length: 7 }, (_, i) => addDias(ini, i)) };
    }
    // mês: grade começa na segunda da semana do dia 1
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const ini = inicioDaSemana(primeiro);
    const totalDias = 42; // 6 semanas
    const ds = Array.from({ length: totalDias }, (_, i) => addDias(ini, i));
    return { de: ini, ate: addDias(ini, totalDias), dias: ds };
  }, [vista, ref]);

  const { data: usuarios } = useQuery({ queryKey: ['pessoas'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });
  const { data: eventos } = useQuery({
    queryKey: ['eventos', de.toISOString(), ate.toISOString(), filtro],
    queryFn: () => api<Ocorrencia[]>(`/agenda/eventos?de=${de.toISOString()}&ate=${ate.toISOString()}${filtro ? `&usuarioId=${filtro}` : ''}`),
  });

  function recarregar() { qc.invalidateQueries({ queryKey: ['eventos'] }); }
  function navegar(passo: number) {
    setRef((d) => (vista === 'mes' ? addMeses(d, passo) : addDias(d, passo * (vista === 'semana' ? 7 : 1))));
  }
  function eventosDoDia(d: Date) {
    return (eventos ?? []).filter((e) => mesmodia(new Date(e.inicio), d));
  }
  function abrirCriar(prefill?: { inicio: Date; fim: Date }) {
    setForm({ base: prefill ? { inicio: prefill.inicio.toISOString(), fim: prefill.fim.toISOString() } : undefined });
  }

  const tituloPeriodo =
    vista === 'mes'
      ? `${MESES[ref.getMonth()]} ${ref.getFullYear()}`
      : vista === 'dia'
        ? `${DIAS_LONGO[(ref.getDay() + 6) % 7]}, ${ref.getDate()} ${MESES[ref.getMonth()].slice(0, 3)}`
        : `${dias[0].getDate()}–${dias[6].getDate()} ${MESES[dias[6].getMonth()]}`;

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] text-white leading-none">Agenda</h1>
          <p className="text-[13px] text-zinc-400 mt-1.5">Calendário da empresa · {tituloPeriodo}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-ink-800 border border-white/[0.07] p-0.5">
            {(['mes', 'semana', 'dia'] as Vista[]).map((v) => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1 rounded-md text-[12.5px] capitalize transition ${vista === v ? 'bg-accent text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
                {v === 'mes' ? 'Mês' : v}
              </button>
            ))}
          </div>
          <button onClick={() => navegar(-1)} className="px-2.5 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">←</button>
          <button onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setRef(d); }} className="px-3 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">Hoje</button>
          <button onClick={() => navegar(1)} className="px-2.5 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">→</button>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[13px]">
            <option value="">Todos</option>
            {(usuarios ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <button onClick={() => abrirCriar()} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3 py-1.5 text-[13px]">+ Evento</button>
        </div>
      </div>

      <div className="mt-6">
        {vista === 'mes'
          ? <VisaoMes dias={dias} mesRef={ref} eventosDoDia={eventosDoDia} onEvento={setDetalhe} onDia={(d) => { setVista('dia'); setRef(d); }} />
          : <GradeHora dias={dias} eventos={eventos ?? []} onEvento={setDetalhe} onSlot={(inicio, fim) => abrirCriar({ inicio, fim })} />}
      </div>

      {form && (
        <FormEvento
          usuarios={usuarios ?? []} clientes={clientes ?? []} base={form.base} editId={form.editId}
          onFechar={() => setForm(null)} onSalvo={() => { setForm(null); recarregar(); }} />
      )}
      {detalhe && (
        <DetalheEvento
          ocorrencia={detalhe} podeGerenciar={!!eu && (eu.id === detalhe.criadorId || eu.papel === 'CEO' || eu.papel === 'DIRETOR')}
          onFechar={() => setDetalhe(null)} onAlterado={recarregar}
          onEditar={() => { setForm({ base: detalhe, editId: detalhe.id }); setDetalhe(null); }} />
      )}
    </div>
  );
}

// ─── grade de horas (semana = 7 colunas, dia = 1) ───
function GradeHora({ dias, eventos, onEvento, onSlot }: {
  dias: Date[]; eventos: Ocorrencia[]; onEvento: (o: Ocorrencia) => void; onSlot: (inicio: Date, fim: Date) => void;
}) {
  const hoje = new Date();
  const horas = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 overflow-hidden">
      {/* cabeçalho dos dias */}
      <div className="grid border-b border-white/[0.06]" style={{ gridTemplateColumns: `56px repeat(${dias.length}, 1fr)` }}>
        <div />
        {dias.map((d, i) => {
          const ehHoje = mesmodia(d, hoje);
          return (
            <div key={i} className={`px-2 py-2 text-center border-l border-white/[0.05] ${ehHoje ? 'bg-accent/[0.06]' : ''}`}>
              <div className="text-[10.5px] uppercase tracking-wider text-zinc-500">{DIAS[(d.getDay() + 6) % 7]}</div>
              <div className={`text-[15px] mt-0.5 ${ehHoje ? 'text-accent-soft font-medium' : 'text-zinc-300'}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* corpo rolável */}
      <div className="overflow-y-auto" style={{ maxHeight: '62vh' }} ref={(el) => { if (el && el.scrollTop === 0) el.scrollTop = 7 * ALTURA_HORA; }}>
        <div className="grid relative" style={{ gridTemplateColumns: `56px repeat(${dias.length}, 1fr)` }}>
          {/* coluna de horas */}
          <div className="relative">
            {horas.map((h) => (
              <div key={h} style={{ height: ALTURA_HORA }} className="relative">
                <span className="absolute -top-1.5 right-2 text-[10px] text-zinc-600">{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {dias.map((d, i) => (
            <ColunaDia key={i} dia={d} eventos={eventos.filter((e) => mesmodia(new Date(e.inicio), d))} horas={horas} onEvento={onEvento} onSlot={onSlot} ehHoje={mesmodia(d, hoje)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ColunaDia({ dia, eventos, horas, onEvento, onSlot, ehHoje }: {
  dia: Date; eventos: Ocorrencia[]; horas: number[]; onEvento: (o: Ocorrencia) => void; onSlot: (i: Date, f: Date) => void; ehHoje: boolean;
}) {
  // lanes p/ sobreposição
  const comTempo = eventos.filter((e) => !e.diaInteiro);
  const ordenados = [...comTempo].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const lanes: Ocorrencia[][] = [];
  const posicao = new Map<string, { lane: number; total: number }>();
  for (const ev of ordenados) {
    const ini = new Date(ev.inicio).getTime();
    let lane = lanes.findIndex((col) => new Date(col[col.length - 1].fim).getTime() <= ini);
    if (lane === -1) { lane = lanes.length; lanes.push([]); }
    lanes[lane].push(ev);
    posicao.set(ev.ocorrenciaInicio + ev.id, { lane, total: 0 });
  }
  const total = Math.max(1, lanes.length);
  posicao.forEach((p) => (p.total = total));

  const diaInteiro = eventos.filter((e) => e.diaInteiro);

  return (
    <div className={`relative border-l border-white/[0.05] ${ehHoje ? 'bg-accent/[0.03]' : ''}`}>
      {diaInteiro.length > 0 && (
        <div className="absolute top-0 inset-x-0.5 z-20 space-y-0.5 p-0.5">
          {diaInteiro.map((e) => (
            <button key={e.id + e.ocorrenciaInicio} onClick={() => onEvento(e)}
              className="block w-full text-left rounded bg-accent/25 text-accent-soft text-[10.5px] px-1.5 py-0.5 truncate">{e.titulo}</button>
          ))}
        </div>
      )}
      {horas.map((h) => (
        <div key={h} style={{ height: ALTURA_HORA }} className="border-t border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
          onClick={() => { const i = new Date(dia); i.setHours(h, 0, 0, 0); const f = new Date(i); f.setHours(h + 1); onSlot(i, f); }} />
      ))}
      {comTempo.map((e) => {
        const ini = new Date(e.inicio); const fim = new Date(e.fim);
        const topMin = minutosDoDia(ini);
        const fimMin = mesmodia(fim, dia) ? minutosDoDia(fim) : 24 * 60;
        const altura = Math.max(18, ((fimMin - topMin) / 60) * ALTURA_HORA);
        const p = posicao.get(e.ocorrenciaInicio + e.id)!;
        const largura = 100 / p.total;
        return (
          <button key={e.id + e.ocorrenciaInicio} onClick={() => onEvento(e)}
            className="absolute rounded-md bg-ink-800 border-l-2 border-accent px-1.5 py-1 text-left overflow-hidden hover:bg-ink-700 transition shadow-sm"
            style={{ top: (topMin / 60) * ALTURA_HORA, height: altura, left: `calc(${p.lane * largura}% + 2px)`, width: `calc(${largura}% - 4px)` }}>
            <div className="text-[11px] text-zinc-100 leading-tight truncate">{e.titulo}</div>
            <div className="text-[9.5px] text-zinc-500 truncate">{hhmm(e.inicio)}{e.cliente && ` · ${e.cliente.nome}`}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── visão mês ───
function VisaoMes({ dias, mesRef, eventosDoDia, onEvento, onDia }: {
  dias: Date[]; mesRef: Date; eventosDoDia: (d: Date) => Ocorrencia[]; onEvento: (o: Ocorrencia) => void; onDia: (d: Date) => void;
}) {
  const hoje = new Date();
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
      <div className="grid grid-cols-7 bg-ink-850/80 border-b border-white/[0.06]">
        {DIAS.map((d) => <div key={d} className="px-2 py-2 text-[10.5px] uppercase tracking-wider text-zinc-500 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 bg-white/[0.05] gap-px">
        {dias.map((d, i) => {
          const doMes = d.getMonth() === mesRef.getMonth();
          const ehHoje = mesmodia(d, hoje);
          const evs = eventosDoDia(d);
          return (
            <div key={i} className={`bg-ink-850/60 min-h-[96px] p-1.5 ${doMes ? '' : 'opacity-40'} ${ehHoje ? 'bg-accent/[0.05]' : ''}`}>
              <button onClick={() => onDia(d)} className={`text-[11.5px] mb-1 px-1 rounded ${ehHoje ? 'text-accent-soft font-medium' : 'text-zinc-400'} hover:text-white`}>{d.getDate()}</button>
              <div className="space-y-0.5">
                {evs.slice(0, 3).map((e) => (
                  <button key={e.id + e.ocorrenciaInicio} onClick={() => onEvento(e)}
                    className="block w-full text-left rounded bg-ink-800 border-l-2 border-accent px-1 py-0.5 text-[10px] text-zinc-200 truncate hover:bg-ink-700">
                    {!e.diaInteiro && <span className="text-zinc-500">{hhmm(e.inicio)} </span>}{e.titulo}
                  </button>
                ))}
                {evs.length > 3 && <button onClick={() => onDia(d)} className="text-[10px] text-accent-soft px-1">+{evs.length - 3} mais</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── detalhe do evento ───
function DetalheEvento({ ocorrencia: e, podeGerenciar, onFechar, onAlterado, onEditar }: {
  ocorrencia: Ocorrencia; podeGerenciar: boolean; onFechar: () => void; onAlterado: () => void; onEditar: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const ehUrl = e.local && /^https?:\/\//.test(e.local);
  const recor = rotuloRecorrencia(e.rrule);

  async function excluir() {
    if (!confirm(e.recorrente ? 'Excluir a série inteira?' : 'Excluir este evento?')) return;
    setOcupado(true);
    await api(`/agenda/eventos/${e.id}`, { method: 'DELETE' });
    onAlterado(); onFechar();
  }
  async function cancelarOcorrencia() {
    if (!confirm('Cancelar apenas esta ocorrência?')) return;
    setOcupado(true);
    await api(`/agenda/eventos/${e.id}/cancelar-ocorrencia`, { method: 'POST', body: JSON.stringify({ dataOriginal: e.ocorrenciaInicio }) });
    onAlterado(); onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4" onClick={onFechar}>
      <div className="w-[440px] max-w-full rounded-2xl border border-white/[0.08] bg-ink-850 p-6" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl text-white leading-tight">{e.titulo}</h2>
            <p className="text-[13px] text-zinc-400 mt-1">
              {e.diaInteiro ? 'Dia inteiro' : `${hhmm(e.inicio)} – ${hhmm(e.fim)}`} · {new Date(e.inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
            {recor && <p className="text-[12px] text-accent-soft mt-0.5">↻ {recor}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-2.5 text-[13px]">
          {e.local && (
            <div className="flex gap-2 text-zinc-300">
              <span className="text-zinc-500 w-16 shrink-0">Local</span>
              {ehUrl ? <a href={e.local} target="_blank" rel="noreferrer" className="text-accent-soft hover:underline truncate">Entrar na reunião</a> : <span>{e.local}</span>}
            </div>
          )}
          {e.cliente && <div className="flex gap-2 text-zinc-300"><span className="text-zinc-500 w-16 shrink-0">Cliente</span><span>{e.cliente.nome}</span></div>}
          {e.descricao && <div className="flex gap-2 text-zinc-300"><span className="text-zinc-500 w-16 shrink-0">Notas</span><span className="whitespace-pre-wrap">{e.descricao}</span></div>}
          {e.participantes.length > 0 && (
            <div className="flex gap-2 text-zinc-300">
              <span className="text-zinc-500 w-16 shrink-0">Pessoas</span>
              <div className="flex flex-wrap gap-1">
                {e.participantes.map((p) => (
                  <span key={p.usuario.id} className="inline-flex items-center gap-1 text-[12px] bg-ink-800 rounded-full pl-0.5 pr-2 py-0.5">
                    <span className="h-4 w-4 rounded-full grid place-items-center text-[8px] text-white" style={{ background: p.usuario.avatarCor ?? '#666' }}>{p.usuario.nome.slice(0, 1)}</span>
                    {p.usuario.nome.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
          {e.lembretes.length > 0 && (
            <div className="flex gap-2 text-zinc-300">
              <span className="text-zinc-500 w-16 shrink-0">Lembrete</span>
              <span>{e.lembretes.map((l) => PRESETS_LEMBRETE.find((p) => p.v === l.minutosAntes)?.label ?? `${l.minutosAntes} min`).join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 mt-6">
          <div>
            {podeGerenciar && e.recorrente && (
              <button disabled={ocupado} onClick={cancelarOcorrencia} className="text-[12.5px] text-zinc-400 hover:text-zinc-200">Cancelar esta ocorrência</button>
            )}
          </div>
          <div className="flex gap-2">
            {podeGerenciar && <button disabled={ocupado} onClick={excluir} className="px-3 py-1.5 rounded-lg text-[13px] text-red-300/80 border border-red-400/20 hover:bg-red-500/10">Excluir</button>}
            {podeGerenciar && <button onClick={onEditar} className="px-3 py-1.5 rounded-lg text-[13px] text-white bg-accent hover:bg-accent-deep">Editar</button>}
            {!podeGerenciar && <button onClick={onFechar} className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-300 border border-white/[0.08]">Fechar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── form criar/editar ───
function FormEvento({ usuarios, clientes, base, editId, onFechar, onSalvo }: {
  usuarios: Usuario[]; clientes: Cliente[]; base?: Partial<Ocorrencia>; editId?: string; onFechar: () => void; onSalvo: () => void;
}) {
  const baseIni = base?.inicio ? new Date(base.inicio) : (() => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return d; })();
  const baseFim = base?.fim ? new Date(base.fim) : new Date(baseIni.getTime() + 60 * 60_000);
  const rr = lerRRule(base?.rrule);

  const [titulo, setTitulo] = useState(base?.titulo ?? '');
  const [descricao, setDescricao] = useState(base?.descricao ?? '');
  const [local, setLocal] = useState(base?.local ?? '');
  const [data, setData] = useState(toDateInput(baseIni));
  const [diaInteiro, setDiaInteiro] = useState(base?.diaInteiro ?? false);
  const [hIni, setHIni] = useState(toTimeInput(baseIni));
  const [hFim, setHFim] = useState(toTimeInput(baseFim));
  const [clienteId, setClienteId] = useState(base?.cliente?.id ?? '');
  const [parts, setParts] = useState<string[]>(base?.participantes?.map((p) => p.usuario.id) ?? []);
  const [lembretes, setLembretes] = useState<number[]>(base?.lembretes?.map((l) => l.minutosAntes) ?? [10]);
  const [freq, setFreq] = useState(rr.freq);
  const [byday, setByday] = useState<string[]>(rr.byday);
  const [recorrenciaFim, setRecorrenciaFim] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    if (!titulo.trim()) return;
    setOcupado(true);
    const inicio = diaInteiro ? new Date(`${data}T00:00`) : new Date(`${data}T${hIni}`);
    const fim = diaInteiro ? new Date(`${data}T23:59`) : new Date(`${data}T${hFim}`);
    const corpo = {
      titulo, descricao: descricao || undefined, local: local || undefined,
      inicio: inicio.toISOString(), fim: fim.toISOString(), diaInteiro,
      rrule: construirRRule(freq, byday, 1) ?? undefined,
      recorrenciaFim: freq !== 'NENHUMA' && recorrenciaFim ? new Date(`${recorrenciaFim}T23:59`).toISOString() : undefined,
      clienteId: clienteId || undefined,
      participantes: parts.length ? parts : undefined,
      lembretes,
    };
    await api(editId ? `/agenda/eventos/${editId}` : '/agenda/eventos', { method: editId ? 'PATCH' : 'POST', body: JSON.stringify(corpo) });
    onSalvo();
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4 overflow-y-auto" onClick={onFechar}>
      <div className="w-[460px] max-w-full rounded-2xl border border-white/[0.08] bg-ink-850 p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl text-white mb-4">{editId ? 'Editar evento' : 'Novo evento'}</h2>
        <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título"
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[14px] mb-3 outline-none focus:border-accent/50" />

        <label className="flex items-center gap-2 text-[13px] text-zinc-300 mb-2 select-none">
          <input type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} className="accent-accent" /> Dia inteiro
        </label>
        <div className="flex gap-2 mb-3">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="flex-1 bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px]" />
          {!diaInteiro && <>
            <input type="time" value={hIni} onChange={(e) => setHIni(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-2 py-2 text-[13px]" />
            <input type="time" value={hFim} onChange={(e) => setHFim(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-2 py-2 text-[13px]" />
          </>}
        </div>

        {/* recorrência */}
        <div className="flex gap-2 mb-2 items-center">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 w-20">Repete</span>
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className="flex-1 bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[13px]">
            <option value="NENHUMA">Não repete</option>
            <option value="DIARIA">Diariamente</option>
            <option value="SEMANAL">Semanalmente</option>
            <option value="MENSAL">Mensalmente</option>
          </select>
        </div>
        {freq === 'SEMANAL' && (
          <div className="flex gap-1 mb-2 pl-[88px]">
            {DIAS_BYDAY.map((d, i) => {
              const on = byday.includes(d.cod);
              return <button key={i} onClick={() => setByday((b) => on ? b.filter((x) => x !== d.cod) : [...b, d.cod])}
                className={`h-7 w-7 rounded-full text-[11px] ${on ? 'bg-accent text-white' : 'bg-ink-800 text-zinc-400 border border-white/[0.07]'}`}>{d.label}</button>;
            })}
          </div>
        )}
        {freq !== 'NENHUMA' && (
          <div className="flex gap-2 mb-3 items-center pl-[88px]">
            <span className="text-[12px] text-zinc-500">até</span>
            <input type="date" value={recorrenciaFim} onChange={(e) => setRecorrenciaFim(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-2 py-1.5 text-[12px]" />
            <span className="text-[11px] text-zinc-600">(vazio = sem fim)</span>
          </div>
        )}

        <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Local ou link da reunião"
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] mb-3 outline-none" />
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Notas" rows={2}
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] mb-3 outline-none resize-none" />
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] mb-3">
          <option value="">Sem cliente vinculado</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Lembrete</div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {PRESETS_LEMBRETE.map((p) => {
            const on = lembretes.includes(p.v);
            return <button key={p.v} onClick={() => setLembretes((l) => on ? l.filter((x) => x !== p.v) : [...l, p.v])}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${on ? 'bg-accent/20 text-accent-soft border-accent/40' : 'border-white/[0.08] text-zinc-500'}`}>{p.label}</button>;
          })}
        </div>

        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Participantes</div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {usuarios.map((u) => {
            const on = parts.includes(u.id);
            return <button key={u.id} onClick={() => setParts((p) => on ? p.filter((x) => x !== u.id) : [...p, u.id])}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${on ? 'bg-accent/20 text-accent-soft border-accent/40' : 'border-white/[0.08] text-zinc-500'}`}>{u.nome}</button>;
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onFechar} className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-400 border border-white/[0.08]">Cancelar</button>
          <button disabled={ocupado} onClick={salvar} className="px-3 py-1.5 rounded-lg text-[13px] text-white bg-accent hover:bg-accent-deep disabled:opacity-50">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function toDateInput(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function toTimeInput(d: Date) { return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
