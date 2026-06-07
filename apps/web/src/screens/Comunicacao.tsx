import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { entrarNaSala } from '@/lib/socket';

// normaliza p/ casar @menção sem depender de acento/caixa
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// cliente marcado quando "@Nome" aparece no texto seguido de fronteira (evita "@Loja" casar "@Loja Norte")
const mencionado = (texto: string, nome: string) =>
  new RegExp('@' + escapeRegex(nome) + '(?![\\p{L}\\p{N}])', 'u').test(texto);

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
  const inputRef = useRef<HTMLInputElement>(null);
  // autocomplete de @menção: query ativa, posição do '@' e item destacado
  const [ac, setAc] = useState<{ start: number; query: string } | null>(null);
  const [acSel, setAcSel] = useState(0);

  const { data: canais } = useQuery({ queryKey: ['canais'], queryFn: () => api<Canal[]>('/comunicacao/canais') });
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api<Cliente[]>('/clientes') });
  const nomes = useMemo(() => new Map((clientes ?? []).map((c) => [c.id, c])), [clientes]);

  // sugestões filtradas pela query do '@' atual
  const sugestoes = useMemo(() => {
    if (!ac) return [];
    const q = norm(ac.query);
    return (clientes ?? []).filter((c) => norm(c.nome).includes(q)).slice(0, 6);
  }, [ac, clientes]);
  // clientes efetivamente marcados = derivados do texto (fonte única da verdade)
  const marcados = useMemo(
    () => (clientes ?? []).filter((c) => mencionado(texto, c.nome)),
    [clientes, texto],
  );

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

  // a cada digitação, detecta um '@<query>' ativo logo antes do cursor
  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    setTexto(valor);
    const cursor = e.target.selectionStart ?? valor.length;
    const antes = valor.slice(0, cursor);
    // '@' precedido de início/espaço; query sem novo '@' (nome pode ter espaços)
    const m = antes.match(/(?:^|\s)@([^@]*)$/);
    if (m && m[1].length <= 40) {
      setAc({ start: cursor - m[1].length - 1, query: m[1] });
      setAcSel(0);
    } else {
      setAc(null);
    }
  }

  // insere "@Nome " no lugar da query, mantendo o resto do texto
  function escolher(nome: string) {
    if (!ac) return;
    const fim = (inputRef.current?.selectionStart ?? texto.length);
    const novo = texto.slice(0, ac.start) + '@' + nome + ' ' + texto.slice(fim);
    setTexto(novo);
    setAc(null);
    const caret = ac.start + nome.length + 2;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (ac && sugestoes.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcSel((i) => (i + 1) % sugestoes.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcSel((i) => (i - 1 + sugestoes.length) % sugestoes.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); escolher(sugestoes[acSel].nome); return; }
      if (e.key === 'Escape') { e.preventDefault(); setAc(null); return; }
    }
    if (e.key === 'Enter') enviar();
  }

  async function enviar() {
    if (!texto.trim() || !canalId) return;
    await api(`/comunicacao/canais/${canalId}/mensagens`, {
      method: 'POST',
      body: JSON.stringify({
        conteudo: texto,
        mencoes: marcados.map((c) => ({ tipo: 'CLIENTE', alvoId: c.id })),
      }),
    });
    setTexto('');
    setAc(null);
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
          {mensagens && mensagens.length === 0 && <div className="text-[13px] text-zinc-600">Sem mensagens. Digite @ p/ marcar um cliente e vincular ao card.</div>}
        </div>
        <div className="px-6 py-4 border-t border-white/[0.07]">
          {marcados.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {marcados.map((c) => (
                <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-soft border border-accent/40">
                  🔗 {c.emoji ?? ''} {c.nome}
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            {ac && sugestoes.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-72 bg-ink-800 border border-white/[0.1] rounded-xl overflow-hidden shadow-xl shadow-black/40">
                {sugestoes.map((c, i) => (
                  <button key={c.id} onMouseDown={(e) => { e.preventDefault(); escolher(c.nome); }}
                    onMouseEnter={() => setAcSel(i)}
                    className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 ${i === acSel ? 'bg-accent/20 text-white' : 'text-zinc-300'}`}>
                    <span>{c.emoji ?? '🔗'}</span> {c.nome}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 bg-ink-800 border border-white/[0.07] rounded-xl px-3.5 py-2.5">
              <input ref={inputRef} value={texto} onChange={aoDigitar} onKeyDown={aoTeclar}
                placeholder="Mensagem… digite @ p/ marcar um cliente"
                className="bg-transparent flex-1 text-[13px] outline-none placeholder:text-zinc-600" />
              <button onClick={enviar} className="bg-accent hover:bg-accent-deep text-white rounded-lg px-3 py-1.5 text-[13px]">Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
