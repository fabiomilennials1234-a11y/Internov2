import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

interface Diretor {
  id: string;
  nome: string;
  papel: string;
  avatarCor?: string;
}

const item = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-400 hover:bg-ink-800 hover:text-zinc-200 transition';
const ativo = 'bg-[rgba(124,108,246,0.14)] text-white shadow-[inset_0_0_0_1px_rgba(124,108,246,0.25)]';

export function Sidebar() {
  const logout = useAuth((s) => s.logout);
  const usuario = useAuth((s) => s.usuario);
  const { data: diretores } = useQuery({
    queryKey: ['diretores'],
    queryFn: () => api<Diretor[]>('/pessoas/usuarios'),
  });
  const dirs = (diretores ?? []).filter((d) => d.papel === 'DIRETOR');

  return (
    <aside className="w-[248px] shrink-0 flex flex-col border-r border-white/[0.07] bg-ink-900/70 h-screen sticky top-0">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-deep grid place-items-center text-white font-bold text-sm">M</div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">MilennialsTECH</div>
          <div className="text-[11px] text-zinc-500">Sistema Interno</div>
        </div>
      </div>

      <nav className="px-3 mt-2 space-y-0.5 overflow-y-auto flex-1">
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>🏠 <span>Hub</span></NavLink>
        <NavLink to="/clientes" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>🗂️ <span>Clientes</span></NavLink>
        <NavLink to="/pessoas" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>👥 <span>Pessoas</span></NavLink>
        <NavLink to="/comunicacao" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>💬 <span>Comunicação</span></NavLink>
        <NavLink to="/agenda" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>🗓️ <span>Agenda</span></NavLink>
        <NavLink to="/indicadores" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>📈 <span>Indicadores</span></NavLink>
        <NavLink to="/tv" className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>📺 <span>TV-Dashboard</span></NavLink>

        <div className="px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider text-zinc-600">Kanban · por diretor</div>
        {dirs.map((d) => (
          <NavLink key={d.id} to={`/kanban/${d.id}`} className={({ isActive }) => `${item} ${isActive ? ativo : ''}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.avatarCor ?? '#888' }} />
            <span>{d.nome}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.07]">
        <button onClick={logout} className="w-full text-left text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1.5">
          Sair · {usuario?.papel}
        </button>
      </div>
    </aside>
  );
}
