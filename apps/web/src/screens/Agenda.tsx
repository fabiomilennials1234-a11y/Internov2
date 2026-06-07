import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Usuario { id: string; nome: string; avatarCor?: string }
interface Cliente { id: string; nome: string }
interface Evento {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  cliente?: { id: string; nome: string };
  participantes: { usuario: Usuario }[];
}

function inicioDaSemana(base: Date) {
  const d = new Date(base);
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dia);
  d.setHours(0, 0, 0, 0);
  return d;
}
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function Agenda() {
  const qc = useQueryClient();
  const [refSemana, setRefSemana] = useState(() => inicioDaSemana(new Date()));
  const [filtro, setFiltro] = useState<string>(''); // '' = todos
  const [abrirForm, setAbrirForm] = useState(false);

  const de = refSemana;
  const ate = useMemo(() => {
    const d = new Date(refSemana);
    d.setDate(d.getDate() + 7);
    return d;
  }, [refSemana]);

  const { data: usuarios } = useQuery({ queryKey: ['pessoas'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });
  const { data: eventos } = useQuery({
    queryKey: ['eventos', de.toISOString(), filtro],
    queryFn: () =>
      api<Evento[]>(`/agenda/eventos?de=${de.toISOString()}&ate=${ate.toISOString()}${filtro ? `&usuarioId=${filtro}` : ''}`),
  });

  const dias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(refSemana);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [refSemana],
  );
  const hoje = new Date().toDateString();

  function eventosDoDia(d: Date) {
    return (eventos ?? []).filter((e) => new Date(e.inicio).toDateString() === d.toDateString());
  }
  function navegar(semanas: number) {
    const d = new Date(refSemana);
    d.setDate(d.getDate() + semanas * 7);
    setRefSemana(d);
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] text-white leading-none">Agenda</h1>
          <p className="text-[13px] text-zinc-400 mt-1.5">Calendário da empresa · veja a agenda de qualquer pessoa</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="px-2.5 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">←</button>
          <button onClick={() => setRefSemana(inicioDaSemana(new Date()))} className="px-3 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">Hoje</button>
          <button onClick={() => navegar(1)} className="px-2.5 py-1.5 rounded-lg bg-ink-800 border border-white/[0.07] text-[13px]">→</button>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[13px]">
            <option value="">Todos</option>
            {(usuarios ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <button onClick={() => setAbrirForm(true)} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3 py-1.5 text-[13px]">+ Evento</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.07]">
        {dias.map((d, i) => (
          <div key={i} className={`bg-ink-850/60 min-h-[260px] p-2 ${d.toDateString() === hoje ? 'bg-accent/[0.05]' : ''}`}>
            <div className="text-[11px] text-zinc-500 mb-2 px-1">
              {DIAS[i]} {d.getDate()}{d.toDateString() === hoje && <span className="text-accent-soft"> · hoje</span>}
            </div>
            <div className="space-y-1.5">
              {eventosDoDia(d).map((e) => (
                <div key={e.id} className="rounded-lg bg-ink-800 border-l-2 border-accent px-2 py-1.5">
                  <div className="text-[12px] text-zinc-200 leading-tight">{e.titulo}</div>
                  <div className="text-[10.5px] text-zinc-500">
                    {new Date(e.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {e.cliente && <span className="text-accent-soft"> · {e.cliente.nome}</span>}
                  </div>
                  {e.participantes.length > 0 && (
                    <div className="flex -space-x-1.5 mt-1">
                      {e.participantes.slice(0, 4).map((p) => (
                        <span key={p.usuario.id} className="h-4 w-4 rounded-full grid place-items-center text-[8px] text-white ring-1 ring-ink-850" style={{ background: p.usuario.avatarCor ?? '#666' }}>
                          {p.usuario.nome.slice(0, 1)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {abrirForm && (
        <FormEvento usuarios={usuarios ?? []} clientes={clientes ?? []} onFechar={() => setAbrirForm(false)}
          onSalvo={() => { setAbrirForm(false); qc.invalidateQueries({ queryKey: ['eventos'] }); }} />
      )}
    </div>
  );
}

function FormEvento({ usuarios, clientes, onFechar, onSalvo }: { usuarios: Usuario[]; clientes: Cliente[]; onFechar: () => void; onSalvo: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [hIni, setHIni] = useState('09:00');
  const [hFim, setHFim] = useState('10:00');
  const [clienteId, setClienteId] = useState('');
  const [parts, setParts] = useState<string[]>([]);

  async function salvar() {
    if (!titulo.trim()) return;
    await api('/agenda/eventos', {
      method: 'POST',
      body: JSON.stringify({
        titulo,
        inicio: new Date(`${data}T${hIni}`).toISOString(),
        fim: new Date(`${data}T${hFim}`).toISOString(),
        clienteId: clienteId || undefined,
        participantes: parts.length ? parts : undefined,
      }),
    });
    onSalvo();
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50" onClick={onFechar}>
      <div className="w-[420px] rounded-2xl border border-white/[0.08] bg-ink-850 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl text-white mb-4">Novo evento</h2>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título"
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] mb-3 outline-none" />
        <div className="flex gap-2 mb-3">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="flex-1 bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px]" />
          <input type="time" value={hIni} onChange={(e) => setHIni(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-2 py-2 text-[13px]" />
          <input type="time" value={hFim} onChange={(e) => setHFim(e.target.value)} className="bg-ink-800 border border-white/[0.07] rounded-lg px-2 py-2 text-[13px]" />
        </div>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] mb-3">
          <option value="">Sem cliente vinculado</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Participantes</div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {usuarios.map((u) => {
            const on = parts.includes(u.id);
            return (
              <button key={u.id} onClick={() => setParts((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))}
                className={`text-[11px] px-2 py-0.5 rounded-full border ${on ? 'bg-accent/20 text-accent-soft border-accent/40' : 'border-white/[0.08] text-zinc-500'}`}>
                {u.nome}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onFechar} className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-400 border border-white/[0.08]">Cancelar</button>
          <button onClick={salvar} className="px-3 py-1.5 rounded-lg text-[13px] text-white bg-accent hover:bg-accent-deep">Salvar</button>
        </div>
      </div>
    </div>
  );
}
