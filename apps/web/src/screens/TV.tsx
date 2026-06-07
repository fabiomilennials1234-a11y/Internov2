import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ResumoTv { clientesAtivos: number; emRisco: number }

export function TV() {
  const { data } = useQuery({
    queryKey: ['tv'],
    queryFn: () => api<ResumoTv>('/dashboards/tv'),
    refetchInterval: 15_000, // ao vivo
  });

  const Tile = ({ rotulo, valor, cor }: { rotulo: string; valor: string | number; cor?: string }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-850/60 p-7">
      <div className="text-[13px] uppercase tracking-wider text-zinc-500">{rotulo}</div>
      <div className="font-serif text-[3rem] leading-none mt-2" style={{ color: cor ?? '#fff' }}>{valor}</div>
    </div>
  );

  return (
    <div className="px-10 py-9">
      <div className="flex items-center justify-between mb-8">
        <div className="font-serif text-[24px] text-white">MilennialsTECH · Pulso ao vivo</div>
        <div className="flex items-center gap-2 text-[13px] text-zinc-400">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" /> ao vivo
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <Tile rotulo="Clientes ativos" valor={data?.clientesAtivos ?? '—'} />
        <Tile rotulo="Em risco" valor={data?.emRisco ?? '—'} cor="#fda4af" />
        <Tile rotulo="Saudáveis" valor={data ? data.clientesAtivos - data.emRisco : '—'} cor="#6ee7b7" />
      </div>
    </div>
  );
}
