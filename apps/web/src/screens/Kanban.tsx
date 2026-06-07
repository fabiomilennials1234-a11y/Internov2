import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Tarefa { id: string; titulo: string; responsavel?: { nome: string; avatarCor?: string } }
interface Coluna { id: string; nome: string; tarefas: Tarefa[] }
interface Board { id: string; nome: string; colunas: Coluna[] }

// Kanban por diretor: colunas custom do dono + drag-and-drop entre etapas.
export function Kanban() {
  const { donoId } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['boards', donoId],
    queryFn: () => api<Board[]>(`/projetos/boards?donoId=${donoId}`),
    enabled: !!donoId,
  });
  const board = data?.[0];

  async function soltar(tarefaId: string, colunaId: string, ordem: number) {
    await api(`/projetos/tarefas/${tarefaId}/mover`, { method: 'PATCH', body: JSON.stringify({ colunaId, ordem }) });
    qc.invalidateQueries({ queryKey: ['boards', donoId] });
  }

  return (
    <div className="px-8 py-7">
      <h1 className="font-serif text-[28px] text-white">{board?.nome ?? 'Kanban'}</h1>
      <p className="text-[13px] text-zinc-400 mt-1.5 mb-6">Etapas definidas pelo diretor · arraste para mover</p>
      {!board && <div className="text-[13px] text-zinc-600">Sem board ainda.</div>}
      {board && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${board.colunas.length}, minmax(0,1fr))` }}>
          {board.colunas.map((col) => (
            <div key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => soltar(e.dataTransfer.getData('text/plain'), col.id, col.tarefas.length)}
              className="rounded-xl border border-white/[0.06] bg-ink-900/50 p-3 min-h-[200px]">
              <div className="flex justify-between text-[12px] text-zinc-400 px-1 pb-2">{col.nome} <span className="text-zinc-600">{col.tarefas.length}</span></div>
              {col.tarefas.map((t) => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                  className="rounded-lg border border-white/[0.06] bg-ink-800/80 p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-accent/30">
                  <div className="text-[13px] text-zinc-200">{t.titulo}</div>
                  {t.responsavel && (
                    <div className="mt-2 flex justify-end">
                      <span className="h-5 w-5 rounded-full grid place-items-center text-[9px] text-white" style={{ background: t.responsavel.avatarCor ?? '#666' }}>
                        {t.responsavel.nome.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
