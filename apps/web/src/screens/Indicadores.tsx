import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Medicao { valor: number }
interface Kpi { id: string; nome: string; unidade?: string; meta?: number; fonte: string; medicoes: Medicao[] }
interface Okr { id: string; titulo: string; nivel: string; donoTipo: string; kpis: Kpi[] }

export function Indicadores() {
  const { data } = useQuery({ queryKey: ['okrs'], queryFn: () => api<Okr[]>('/indicadores/okrs') });

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">Indicadores</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">OKRs & KPIs · defina primeiro, alimente depois (dados derivados)</p>

      {(data ?? []).length === 0 && <div className="text-[13px] text-zinc-600">Nenhum OKR definido. CEO/Diretor define o primeiro.</div>}

      <div className="grid grid-cols-12 gap-5">
        {(data ?? []).map((okr) => (
          <div key={okr.id} className="col-span-12 lg:col-span-6 rounded-2xl border border-white/[0.07] bg-ink-850/55 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[14px] font-semibold text-white">{okr.titulo}</div>
              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-soft">{okr.nivel} · {okr.donoTipo}</span>
            </div>
            <div className="mt-4 space-y-3.5">
              {okr.kpis.map((k) => {
                const atual = k.medicoes[0]?.valor;
                const pct = k.meta && atual != null ? Math.min(100, Math.round((atual / k.meta) * 100)) : null;
                return (
                  <div key={k.id}>
                    <div className="flex justify-between text-[12.5px] text-zinc-400 mb-1">
                      <span>{k.nome}</span>
                      <span className="text-white">{atual ?? '—'}{k.unidade ?? ''} {k.meta && <span className="text-zinc-500 text-[11px]">/ {k.meta}</span>}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">fonte: {k.fonte.toLowerCase()}</div>
                  </div>
                );
              })}
              {okr.kpis.length === 0 && <div className="text-[12px] text-zinc-600">Sem KPI ainda.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
