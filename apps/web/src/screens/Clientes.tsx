import { useQuery } from '@tanstack/react-query';
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

const rotulo: Record<string, string> = {
  ONBOARDING: 'Onboarding', EM_EXECUCAO: 'Em execução', EM_REVISAO: 'Em revisão', ATIVO: 'Ativo', ENCERRADO: 'Encerrado',
};
const rotuloSaude: Record<string, string> = { BOA: 'Boa', ATENCAO: 'Atenção', RISCO: 'Risco' };
const corSaude: Record<string, string> = {
  BOA: 'bg-emerald-500/15 text-emerald-300', ATENCAO: 'bg-amber-500/15 text-amber-300', RISCO: 'bg-rose-500/15 text-rose-300',
};

export function Clientes() {
  const { data, isLoading } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">Clientes</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">Card universal · gestão da entrega (pós-venda)</p>
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
    </div>
  );
}
