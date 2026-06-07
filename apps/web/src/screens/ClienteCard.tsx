import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Card {
  id: string;
  nome: string;
  emoji?: string;
  estagioEntrega: string;
  responsavel?: { nome: string };
  projetos?: { id: string; nome: string; frente: string }[];
}
interface Atividade {
  id: string;
  tipo: string;
  resumo: string;
  criadoEm: string;
  ator?: { nome: string; avatarCor?: string };
}

export function ClienteCard() {
  const { id } = useParams();
  const { data: card } = useQuery({ queryKey: ['cliente', id], queryFn: () => api<Card>(`/clientes/${id}`) });
  const { data: feed } = useQuery({ queryKey: ['cliente-feed', id], queryFn: () => api<Atividade[]>(`/atividades/cliente/${id}`) });

  if (!card) return <div className="p-8 text-zinc-500">Carregando…</div>;

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <Link to="/clientes" className="text-[12px] text-zinc-500 hover:text-zinc-300">← Clientes</Link>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-14 w-14 rounded-2xl bg-white/[0.05] grid place-items-center text-2xl">{card.emoji ?? '🏢'}</div>
        <div>
          <h1 className="font-serif text-[28px] text-white leading-none">{card.nome}</h1>
          <div className="text-[13px] text-zinc-400 mt-1.5">Resp. {card.responsavel?.nome ?? '—'} · {card.estagioEntrega.replace('_', ' ').toLowerCase()}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mt-7">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/[0.07] bg-ink-850/55 p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Frentes (projetos)</div>
            <div className="space-y-2 text-[13px]">
              {(card.projetos ?? []).map((p) => (
                <div key={p.id} className="flex justify-between"><span className="text-zinc-300">{p.nome}</span><span className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">{p.frente}</span></div>
              ))}
              {(!card.projetos || card.projetos.length === 0) && <div className="text-zinc-600">Sem frentes ainda</div>}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8">
          <div className="text-[12px] uppercase tracking-wider text-zinc-500 mb-3">Timeline · atividades & menções</div>
          <div className="space-y-2.5">
            {(feed ?? []).map((a) => (
              <div key={a.id} className="flex gap-3 rounded-xl border border-white/[0.07] bg-ink-850/55 px-4 py-3">
                <span className="h-6 w-6 rounded-full grid place-items-center text-[10px] text-white shrink-0" style={{ background: a.ator?.avatarCor ?? '#666' }}>
                  {a.ator?.nome?.slice(0, 2).toUpperCase() ?? '••'}
                </span>
                <div>
                  <div className="text-[13px] text-zinc-200">{a.resumo}</div>
                  <div className="text-[11px] text-zinc-600">{a.tipo} · {new Date(a.criadoEm).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            ))}
            {(!feed || feed.length === 0) && <div className="text-[13px] text-zinc-600">Sem atividade ainda. Menções a este cliente no chat aparecem aqui.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
