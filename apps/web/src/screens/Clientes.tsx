import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

interface Cliente {
  id: string;
  nome: string;
  emoji?: string;
  estagioEntrega: string;
  saude: string;
  valorMensal?: number;
  responsavel?: { nome: string; avatarCor?: string };
  projetos?: { frente: string }[];
}
interface Usuario { id: string; nome: string }

const rotulo: Record<string, string> = {
  ONBOARDING: 'Onboarding', EM_EXECUCAO: 'Em execução', EM_REVISAO: 'Em revisão', ATIVO: 'Ativo', ENCERRADO: 'Encerrado',
};
const rotuloSaude: Record<string, string> = { BOA: 'Boa', ATENCAO: 'Atenção', RISCO: 'Risco' };
const corSaude: Record<string, string> = {
  BOA: 'bg-emerald-500/15 text-emerald-300', ATENCAO: 'bg-amber-500/15 text-amber-300', RISCO: 'bg-rose-500/15 text-rose-300',
};

export function Clientes() {
  const qc = useQueryClient();
  const [novo, setNovo] = useState(false);
  const [verEncerrados, setVerEncerrados] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', { verEncerrados }],
    queryFn: () => api<Cliente[]>(`/clientes${verEncerrados ? '?incluirEncerrados=true' : ''}`),
  });

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[28px] text-white">Clientes</h1>
          <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">Card universal · gestão da entrega (pós-venda)</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[12px] text-zinc-500 cursor-pointer select-none">
            <input type="checkbox" checked={verEncerrados} onChange={(e) => setVerEncerrados(e.target.checked)} className="accent-accent" />
            Mostrar encerrados
          </label>
          <button onClick={() => setNovo(true)} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3.5 py-2 text-[13px] font-medium">
            + Novo cliente
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/[0.07]">
          <div className="col-span-4">Cliente</div><div className="col-span-3">Frentes</div><div className="col-span-2">Responsável</div><div className="col-span-1">Saúde</div><div className="col-span-2">Estágio</div>
        </div>
        {isLoading && <div className="px-4 py-6 text-[13px] text-zinc-500">Carregando…</div>}
        {(data ?? []).map((c) => (
          <Link key={c.id} to={`/clientes/${c.id}`} className="grid grid-cols-12 items-center px-4 py-3 border-b border-white/[0.04] hover:bg-[rgba(124,108,246,0.07)]">
            <div className="col-span-4 flex items-center gap-3"><span>{c.emoji ?? '🏢'}</span><span className="text-[13.5px] text-white">{c.nome}</span></div>
            <div className="col-span-3 flex gap-1 flex-wrap">{(c.projetos ?? []).map((p, i) => <span key={i} className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">{p.frente}</span>)}</div>
            <div className="col-span-2 text-[12px] text-zinc-400">{c.responsavel?.nome ?? '—'}</div>
            <div className="col-span-1"><span className={`text-[10.5px] px-2 py-0.5 rounded-full ${corSaude[c.saude] ?? 'bg-white/[0.06] text-zinc-300'}`}>{rotuloSaude[c.saude] ?? c.saude}</span></div>
            <div className="col-span-2"><span className="text-[10.5px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-soft">{rotulo[c.estagioEntrega] ?? c.estagioEntrega}</span></div>
          </Link>
        ))}
      </div>

      {novo && <NovoClienteModal onClose={() => setNovo(false)} onCriado={() => { qc.invalidateQueries({ queryKey: ['clientes'] }); setNovo(false); }} />}
    </div>
  );
}

function NovoClienteModal({ onClose, onCriado }: { onClose: () => void; onCriado: () => void }) {
  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [valorReais, setValorReais] = useState('');
  const [contato, setContato] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });

  async function salvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    try {
      await api('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nome: nome.trim(),
          emoji: emoji.trim() || undefined,
          responsavelId: responsavelId || undefined,
          contato: contato.trim() || undefined,
          valorMensal: valorReais ? Math.round(parseFloat(valorReais) * 100) : undefined,
        }),
      });
      onCriado();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[440px] rounded-2xl border border-white/[0.1] bg-ink-850 p-6 shadow-2xl shadow-black/50">
        <h2 className="font-serif text-[20px] text-white mb-1">Novo cliente</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Nasce em Onboarding, saúde Boa. Ajuste depois no card.</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🏢" maxLength={2}
              className="w-14 text-center bg-ink-800 border border-white/[0.08] rounded-lg px-2 py-2 text-[15px] outline-none" />
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente *" autoFocus
              className="flex-1 bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-accent/50" />
          </div>
          <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}
            className="w-full bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-300 outline-none">
            <option value="">Responsável (opcional)</option>
            {(usuarios ?? []).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-ink-800 border border-white/[0.08] rounded-lg px-3">
              <span className="text-[12px] text-zinc-500">R$</span>
              <input value={valorReais} onChange={(e) => setValorReais(e.target.value)} placeholder="Valor mensal" type="number" inputMode="decimal"
                className="flex-1 bg-transparent px-2 py-2 text-[13px] text-white outline-none" />
            </div>
          </div>
          <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Contato (e-mail/telefone)"
            className="w-full bg-ink-800 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="text-[13px] text-zinc-400 px-3 py-2">Cancelar</button>
          <button onClick={salvar} disabled={!nome.trim() || salvando}
            className="bg-accent hover:bg-accent-deep disabled:opacity-40 text-white rounded-lg px-4 py-2 text-[13px] font-medium">
            {salvando ? 'Salvando…' : 'Criar cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
