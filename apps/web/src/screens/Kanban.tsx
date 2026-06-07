import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Tarefa {
  id: string;
  titulo: string;
  responsavel?: { nome: string; avatarCor?: string };
}
interface Coluna {
  id: string;
  nome: string;
  tarefas: Tarefa[];
}
interface Board {
  id: string;
  nome: string;
  colunas: Coluna[];
}

// Kanban por diretor: board com colunas custom do dono.
export function Kanban() {
  const { donoId } = useParams();
  const { data } = useQuery({
    queryKey: ['boards', donoId],
    queryFn: () => api<Board[]>(`/projetos/boards?donoId=${donoId}`),
    enabled: !!donoId,
  });
  const board = data?.[0];

  return (
    <div className="px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">{board?.nome ?? 'Kanban'}</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">Etapas definidas pelo diretor</p>
      {!board && <div className="text-[13px] text-zinc-600">Sem board ainda.</div>}
      {board && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${board.colunas.length}, minmax(0,1fr))` }}>
          {board.colunas.map((col) => (
            <div key={col.id} className="rounded-xl border border-white/[0.06] bg-ink-900/50 p-3">
              <div className="flex justify-between text-[12px] text-zinc-400 px-1 pb-2">{col.nome} <span className="text-zinc-600">{col.tarefas.length}</span></div>
              {col.tarefas.map((t) => (
                <div key={t.id} className="rounded-lg border border-white/[0.06] bg-ink-800/80 p-3 mb-2">
                  <div className="text-[13px] text-zinc-200">{t.titulo}</div>
                  {t.responsavel && <div className="mt-2 flex justify-end"><span className="h-5 w-5 rounded-full grid place-items-center text-[9px] text-white" style={{ background: t.responsavel.avatarCor ?? '#666' }}>{t.responsavel.nome.slice(0, 2).toUpperCase()}</span></div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
