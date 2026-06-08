import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Card {
  id: string;
  nome: string;
  emoji?: string;
  estagioEntrega: string;
  saude: string;
  contato?: string;
  valorMensal?: number;
  responsavel?: { id: string; nome: string };
  projetos?: Frente[];
}
interface Frente { id: string; nome: string; frente: string; status: string; responsavel?: { id: string; nome: string } }
interface Usuario { id: string; nome: string }

// Espelha a máquina de estados de apps/api/src/projetos/status-frente.ts (fonte da verdade).
const PROX_STATUS: Record<string, string[]> = {
  PLANEJADA: ['ATIVA'], ATIVA: ['PAUSADA', 'CONCLUIDA'], PAUSADA: ['ATIVA', 'CONCLUIDA'], CONCLUIDA: ['ATIVA'],
};
const TIPOS_FRENTE = ['MARKETING', 'CRM', 'VENDAS', 'OUTRO'];
const rotuloFrente: Record<string, string> = { MARKETING: 'Marketing', CRM: 'CRM', VENDAS: 'Vendas', OUTRO: 'Outro' };
const rotuloStatusFrente: Record<string, string> = { PLANEJADA: 'Planejada', ATIVA: 'Ativa', PAUSADA: 'Pausada', CONCLUIDA: 'Concluída' };
const corStatusFrente: Record<string, string> = {
  PLANEJADA: 'text-sky-300', ATIVA: 'text-emerald-300', PAUSADA: 'text-amber-300', CONCLUIDA: 'text-zinc-400',
};
interface Atividade {
  id: string;
  tipo: string;
  resumo: string;
  criadoEm: string;
  mensagemId?: string;
  payload?: { canalId?: string };
  ator?: { nome: string; avatarCor?: string };
}

const ESTAGIOS = ['ONBOARDING', 'EM_EXECUCAO', 'EM_REVISAO', 'ATIVO', 'ENCERRADO'];
const rotulo: Record<string, string> = {
  ONBOARDING: 'Onboarding', EM_EXECUCAO: 'Em execução', EM_REVISAO: 'Em revisão', ATIVO: 'Ativo', ENCERRADO: 'Encerrado',
};
const SAUDES = ['BOA', 'ATENCAO', 'RISCO'];
const rotuloSaude: Record<string, string> = { BOA: 'Boa', ATENCAO: 'Atenção', RISCO: 'Risco' };
const corSaude: Record<string, string> = {
  BOA: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  ATENCAO: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  RISCO: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
};

export function ClienteCard() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const { data: card } = useQuery({ queryKey: ['cliente', id], queryFn: () => api<Card>(`/clientes/${id}`) });
  const { data: feed } = useQuery({ queryKey: ['cliente-feed', id], queryFn: () => api<Atividade[]>(`/atividades/cliente/${id}`) });

  async function mudarEstagio(estagio: string) {
    await api(`/clientes/${id}/estagio`, { method: 'PATCH', body: JSON.stringify({ estagio }) });
    qc.invalidateQueries({ queryKey: ['cliente', id] });
    qc.invalidateQueries({ queryKey: ['cliente-feed', id] });
  }

  async function mudarSaude(saude: string) {
    await api(`/clientes/${id}/saude`, { method: 'PATCH', body: JSON.stringify({ saude }) });
    qc.invalidateQueries({ queryKey: ['cliente', id] });
    qc.invalidateQueries({ queryKey: ['cliente-feed', id] });
  }

  if (!card) return <div className="p-8 text-zinc-500">Carregando…</div>;

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <Link to="/clientes" className="text-[12px] text-zinc-500 hover:text-zinc-300">← Clientes</Link>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-14 w-14 rounded-2xl bg-white/[0.05] grid place-items-center text-2xl">{card.emoji ?? '🏢'}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-[28px] text-white leading-none">{card.nome}</h1>
            <button onClick={() => setEditando(true)} className="text-[12px] text-zinc-500 hover:text-accent-soft border border-white/[0.1] rounded-md px-2 py-0.5">✎ Editar</button>
          </div>
          <div className="text-[13px] text-zinc-400 mt-1.5">
            Resp. {card.responsavel?.nome ?? '—'}
            {card.valorMensal != null && <span className="text-zinc-600"> · R$ {(card.valorMensal / 100).toLocaleString('pt-BR')}/mês</span>}
            {card.contato && <span className="text-zinc-600"> · {card.contato}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Saúde</span>
            <select value={card.saude} onChange={(e) => mudarSaude(e.target.value)}
              className={`border rounded-lg px-3 py-1.5 text-[13px] ${corSaude[card.saude] ?? 'text-zinc-300 border-white/[0.07] bg-ink-800'}`}>
              {SAUDES.map((s) => <option key={s} value={s} className="bg-ink-800 text-zinc-200">{rotuloSaude[s]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Estágio</span>
            <select value={card.estagioEntrega} onChange={(e) => mudarEstagio(e.target.value)}
              className="bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[13px] text-accent-soft">
              {ESTAGIOS.map((s) => <option key={s} value={s}>{rotulo[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mt-7">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <FrentesPanel clienteId={card.id} frentes={card.projetos ?? []}
            onMudou={() => { qc.invalidateQueries({ queryKey: ['cliente', id] }); qc.invalidateQueries({ queryKey: ['cliente-feed', id] }); }} />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <div className="text-[12px] uppercase tracking-wider text-zinc-500 mb-3">Timeline · atividades & menções</div>
          <div className="space-y-2.5">
            {(feed ?? []).map((a) => <ItemFeed key={a.id} a={a} onResposta={() => qc.invalidateQueries({ queryKey: ['cliente-feed', id] })} />)}
            {(!feed || feed.length === 0) && <div className="text-[13px] text-zinc-600">Sem atividade ainda. Menções a este cliente no chat aparecem aqui.</div>}
          </div>
        </div>
      </div>

      {editando && (
        <EditarClienteModal card={card} onClose={() => setEditando(false)}
          onSalvo={() => { qc.invalidateQueries({ queryKey: ['cliente', id] }); qc.invalidateQueries({ queryKey: ['cliente-feed', id] }); qc.invalidateQueries({ queryKey: ['clientes'] }); setEditando(false); }} />
      )}
    </div>
  );
}

function EditarClienteModal({ card, onClose, onSalvo }: { card: Card; onClose: () => void; onSalvo: () => void }) {
  const [nome, setNome] = useState(card.nome);
  const [emoji, setEmoji] = useState(card.emoji ?? '');
  const [responsavelId, setResponsavelId] = useState(card.responsavel?.id ?? '');
  const [valorReais, setValorReais] = useState(card.valorMensal != null ? String(card.valorMensal / 100) : '');
  const [contato, setContato] = useState(card.contato ?? '');
  const [salvando, setSalvando] = useState(false);
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });

  async function salvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    try {
      await api(`/clientes/${card.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nome: nome.trim(),
          emoji: emoji.trim() || undefined,
          responsavelId: responsavelId || undefined,
          contato: contato.trim() || undefined,
          valorMensal: valorReais ? Math.round(parseFloat(valorReais) * 100) : undefined,
        }),
      });
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[440px] rounded-2xl border border-white/[0.1] bg-ink-850 p-6 shadow-2xl shadow-black/50">
        <h2 className="font-serif text-[20px] text-white mb-5">Editar cliente</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🏢" maxLength={2}
              className="w-14 text-center bg-ink-800 border border-white/[0.08] rounded-lg px-2 py-2 text-[15px] outline-none" />
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente *"
              className="flex-1 bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-accent/50" />
          </div>
          <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}
            className="w-full bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-300 outline-none">
            <option value="">Sem responsável</option>
            {(usuarios ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <div className="flex items-center bg-ink-800 border border-white/[0.08] rounded-lg px-3">
            <span className="text-[12px] text-zinc-500">R$</span>
            <input value={valorReais} onChange={(e) => setValorReais(e.target.value)} placeholder="Valor mensal" type="number" inputMode="decimal"
              className="flex-1 bg-transparent px-2 py-2 text-[13px] text-white outline-none" />
          </div>
          <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Contato (e-mail/telefone)"
            className="w-full bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="text-[13px] text-zinc-400 px-3 py-2">Cancelar</button>
          <button onClick={salvar} disabled={!nome.trim() || salvando}
            className="bg-accent hover:bg-accent-deep disabled:opacity-40 text-white rounded-lg px-4 py-2 text-[13px] font-medium">
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FrentesPanel({ clienteId, frentes, onMudou }: { clienteId: string; frentes: Frente[]; onMudou: () => void }) {
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('MARKETING');
  const [responsavelId, setResponsavelId] = useState('');
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });

  async function criar() {
    if (!nome.trim()) return;
    await api('/projetos/frentes', {
      method: 'POST',
      body: JSON.stringify({ clienteId, nome: nome.trim(), frente: tipo, responsavelId: responsavelId || undefined }),
    });
    setNome(''); setTipo('MARKETING'); setResponsavelId(''); setCriando(false);
    onMudou();
  }

  async function atualizar(id: string, dados: Record<string, string>) {
    await api(`/projetos/frentes/${id}`, { method: 'PATCH', body: JSON.stringify(dados) });
    onMudou();
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-850/55 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Frentes</div>
        <button onClick={() => setCriando((v) => !v)} className="text-[11px] text-accent-soft hover:text-accent">+ Frente</button>
      </div>

      {criando && (
        <div className="space-y-2 mb-3 pb-3 border-b border-white/[0.06]">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da frente *" autoFocus
            className="w-full bg-ink-800 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[12.5px] text-white outline-none focus:border-accent/50" />
          <div className="flex gap-2">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="flex-1 bg-ink-800 border border-white/[0.08] rounded-lg px-2 py-1.5 text-[12px] text-zinc-300 outline-none">
              {TIPOS_FRENTE.map((t) => <option key={t} value={t}>{rotuloFrente[t]}</option>)}
            </select>
            <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className="flex-1 bg-ink-800 border border-white/[0.08] rounded-lg px-2 py-1.5 text-[12px] text-zinc-300 outline-none">
              <option value="">Responsável</option>
              {(usuarios ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <button onClick={criar} disabled={!nome.trim()} className="w-full bg-accent hover:bg-accent-deep disabled:opacity-40 text-white rounded-lg py-1.5 text-[12px]">Adicionar</button>
        </div>
      )}

      <div className="space-y-2.5 text-[13px]">
        {frentes.map((f) => (
          <div key={f.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-200 truncate">{f.nome}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 shrink-0">{rotuloFrente[f.frente] ?? f.frente}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <select value={f.responsavel?.id ?? ''} onChange={(e) => atualizar(f.id, { responsavelId: e.target.value })}
                className="bg-transparent text-[11.5px] text-zinc-400 outline-none -ml-0.5">
                <option value="">sem responsável</option>
                {(usuarios ?? []).map((u) => <option key={u.id} value={u.id} className="bg-ink-800">{u.nome}</option>)}
              </select>
              <select value={f.status} onChange={(e) => atualizar(f.id, { status: e.target.value })}
                className={`bg-transparent text-[11px] font-medium outline-none text-right ${corStatusFrente[f.status] ?? 'text-zinc-400'}`}>
                <option value={f.status} className="bg-ink-800">{rotuloStatusFrente[f.status] ?? f.status}</option>
                {(PROX_STATUS[f.status] ?? []).map((s) => <option key={s} value={s} className="bg-ink-800">→ {rotuloStatusFrente[s]}</option>)}
              </select>
            </div>
          </div>
        ))}
        {frentes.length === 0 && <div className="text-zinc-600">Sem frentes ainda</div>}
      </div>
    </div>
  );
}

function ItemFeed({ a, onResposta }: { a: Atividade; onResposta: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const podeResponder = a.tipo === 'MENCAO' && a.payload?.canalId && a.mensagemId;

  async function responder() {
    if (!texto.trim() || !a.payload?.canalId) return;
    await api(`/comunicacao/canais/${a.payload.canalId}/mensagens`, {
      method: 'POST',
      body: JSON.stringify({ conteudo: texto, threadPaiId: a.mensagemId }),
    });
    setTexto('');
    setAberto(false);
    onResposta();
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-850/55 px-4 py-3">
      <div className="flex gap-3">
        <span className="h-6 w-6 rounded-full grid place-items-center text-[10px] text-white shrink-0" style={{ background: a.ator?.avatarCor ?? '#666' }}>
          {a.ator?.nome?.slice(0, 2).toUpperCase() ?? '••'}
        </span>
        <div className="flex-1">
          <div className="text-[13px] text-zinc-200">{a.resumo}</div>
          <div className="text-[11px] text-zinc-600">{a.tipo} · {new Date(a.criadoEm).toLocaleString('pt-BR')}</div>
        </div>
        {podeResponder && <button onClick={() => setAberto((v) => !v)} className="text-[11px] text-accent-soft self-start">↩ Responder</button>}
      </div>
      {aberto && (
        <div className="flex gap-2 mt-2 pl-9">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && responder()}
            placeholder="Responder no canal de origem…" className="flex-1 bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[12px] outline-none" />
          <button onClick={responder} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3 text-[12px]">Enviar</button>
        </div>
      )}
    </div>
  );
}
