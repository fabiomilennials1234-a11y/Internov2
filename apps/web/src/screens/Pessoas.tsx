import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  avatarCor?: string;
}

export function Pessoas() {
  const { data } = useQuery({ queryKey: ['pessoas'], queryFn: () => api<Usuario[]>('/pessoas/usuarios') });
  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">Pessoas</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">Equipe · visível para toda a diretoria</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(data ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/55 px-4 py-3">
            <span className="h-9 w-9 rounded-full grid place-items-center text-[12px] text-white" style={{ background: u.avatarCor ?? '#666' }}>
              {u.nome.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-[13.5px] text-white">{u.nome}</div>
              <div className="text-[11.5px] text-zinc-500">{u.papel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
