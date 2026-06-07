import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { entrarNaSala } from '@/lib/socket';

interface Canal { id: string; tipo: string; nome?: string }
interface Cliente { id: string; nome: string; emoji?: string }
interface Mencao { id: string; tipo: string; clienteId?: string; usuarioId?: string }
interface Msg {
  id: string;
  conteudo: string;
  criadoEm: string;
  autor?: { nome: string; avatarCor?: string };
  mencoes: Mencao[];
  respostas?: Msg[];
}

function MensagemView({ m, sub, nomes }: { m: Msg; sub?: boolean; nomes: Map<string, Cliente> }) {
  const clientesMarcados = m.mencoes.filter((x) => x.tipo === 'CLIENTE' && x.clienteId);
  return (
    <div className={`flex gap-3 ${sub ? 'py-1' : 'py-2'}`}>
      <span className="h-7 w-7 rounded-full grid place-items-center text-[10px] text-white shrink-0" style={{ background: m.autor?.avatarCor ?? '#666' }}>
        {m.autor?.nome?.slice(0, 2).toUpperCase() ?? '••'}
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-zinc-200">
          {m.autor?.nome}
          <span className="text-zinc-600 font-normal"> · {new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          {clientesMarcados.map((x) => (
            <span key={x.id} className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent-soft">🔗 {nomes.get(x.clienteId!)?.nome ?? 'cliente'}</span>
          ))}
        </div>
        <div className="text-[13px] text-zinc-300 mt-0.5">{m.conteudo}</div>
        {m.respostas && m.respostas.length > 0 && (
          <div className="mt-1.5 pl-3 border-l-2 border-accent/25 space-y-1">
            {m.respostas.map((r) => <MensagemView key={r.id} m={r} sub nomes={nomes} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function Comunicacao() {
  const qc = useQueryClient();
  const [canalId, setCanalId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [tags, setTags] = useState<string[]>([]); // clienteIds marcados

  const { data: canais } = useQuery({ queryKey: ['canais'], queryFn: () => api<Canal[]>('/comunicacao/canais') });
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });
  const nomes = useMemo(() => new Map((clientes ?? []).map((c) => [c.id, c])), [clientes]);

  useEffect(() => {
    if (!canalId && canais?.length) setCanalId(canais[0].id);
  }, [canais, canalId]);

  const { data: mensagens } = useQuery({
    queryKey: ['mensagens', canalId],
    queryFn: () => api<Msg[]>(`/comunicacao/canais/${canalId}/mensagens`),
    enabled: !!canalId,
  });

  useEffect(() => {
    if (!canalId) return;
    return entrarNaSala(`canal:${canalId}`, 'mensagem', () => {
      qc.invalidateQueries({ queryKey: ['mensagens', canalId] });
    });
  }, [canalId, qc]);

  async function enviar() {
    if (!texto.trim() || !canalId) return;
    await api(`/comunicacao/canais/${canalId}/mensagens`, {
      method: 'POST',
      body: JSON.stringify({
        conteudo: texto,
        mencoes: tags.map((alvoId) => ({ tipo: 'CLIENTE', alvoId })),
      }),
    });
    setTexto('');
    setTags([]);
    qc.invalidateQueries({ queryKey: ['mensagens', canalId] });
  }

  return (
    <div className="flex h-screen">
      <div className="w-[220px] shrink-0 border-r border-white/[0.07] p-3 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-zinc-600 px-2 mb-2">Canais</div>
        {(canais ?? []).map((c) => (
          <button key={c.id} onClick={() => setCanalId(c.id)}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] ${canalId === c.id ? 'bg-[rgba(124,108,246,0.14)] text-white' : 'text-zinc-400 hover:bg-ink-800'}`}>
            # {c.nome}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-6 py-3.5 border-b border-white/[0.07] text-[15px] font-semibold text-white">
          # {canais?.find((c) => c.id === canalId)?.nome ?? '—'}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {(mensagens ?? []).map((m) => <MensagemView key={m.id} m={m} nomes={nomes} />)}
          {mensagens && mensagens.length === 0 && <div className="text-[13px] text-zinc-600">Sem mensagens. Marque um cliente abaixo p/ vincular ao card.</div>}
        </div>
        <div className="px-6 py-4 border-t border-white/[0.07]">
          {(clientes ?? []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {(clientes ?? []).map((c) => {
                const on = tags.includes(c.id);
                return (
                  <button key={c.id} onClick={() => setTags((t) => (on ? t.filter((x) => x !== c.id) : [...t, c.id]))}
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${on ? 'bg-accent/20 text-accent-soft border-accent/40' : 'border-white/[0.08] text-zinc-500'}`}>
                    {c.emoji ?? ''} @{c.nome}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 bg-ink-800 border border-white/[0.07] rounded-xl px-3.5 py-2.5">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()}
              placeholder="Mensagem… marque @cliente nos chips acima p/ contar no card"
              className="bg-transparent flex-1 text-[13px] outline-none placeholder:text-zinc-600" />
            <button onClick={enviar} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3 py-1.5 text-[13px]">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
