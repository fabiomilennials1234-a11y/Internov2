import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

interface Cliente {
  id: string;
  nome: string;
  emoji?: string;
  estagioEntrega: string;
  responsavel?: { nome: string; avatarCor?: string };
}

// Hub feed-first: "o time agora" como herói (decisão validada no mockup).
export function Hub() {
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-9">
      <div className="text-[12px] text-zinc-500 mb-1">Hoje</div>
      <h1 className="font-serif text-[34px] text-white leading-none">Bom dia.</h1>
      <p className="text-zinc-400 mt-2 text-[14px]">O time, agora — o que está em movimento.</p>

      <div className="grid grid-cols-12 gap-6 mt-7">
        <div className="col-span-12 lg:col-span-8">
          <div className="text-[12px] uppercase tracking-wider text-zinc-500 mb-3">Clientes em movimento</div>
          <div className="space-y-2.5">
            {(clientes ?? []).map((c) => (
              <Link key={c.id} to={`/clientes/${c.id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/55 px-4 py-3 hover:border-accent/40 transition">
                <span className="text-lg">{c.emoji ?? '🏢'}</span>
                <div className="flex-1">
                  <div className="text-[14px] text-white">{c.nome}</div>
                  <div className="text-[12px] text-zinc-500">{c.estagioEntrega.replace('_', ' ').toLowerCase()}</div>
                </div>
                {c.responsavel && (
                  <span className="h-6 w-6 rounded-full grid place-items-center text-[10px] text-white" style={{ background: c.responsavel.avatarCor ?? '#666' }}>
                    {c.responsavel.nome.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-2.5">
          <div className="text-[12px] uppercase tracking-wider text-zinc-500 mb-3">Produtos</div>
          <Link to="/clientes" className="block rounded-lg border border-white/[0.07] bg-ink-850/50 px-4 py-2.5 text-[13px] hover:border-accent/40">🗂️ Clientes</Link>
          <Link to="/pessoas" className="block rounded-lg border border-white/[0.07] bg-ink-850/50 px-4 py-2.5 text-[13px] hover:border-accent/40">👥 Pessoas</Link>
          <Link to="/comunicacao" className="block rounded-lg border border-white/[0.07] bg-ink-850/50 px-4 py-2.5 text-[13px] hover:border-accent/40">💬 Comunicação</Link>
        </div>
      </div>
    </div>
  );
}
