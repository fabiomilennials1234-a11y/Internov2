import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';

export function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('gabriel@milennials.tech');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch {
      setErro('Credenciais inválidas');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={entrar} className="w-[360px] rounded-2xl border border-white/[0.07] bg-ink-850/60 p-7 shadow-2xl">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent-deep grid place-items-center text-white font-bold mb-5">M</div>
        <h1 className="font-serif text-2xl text-white">Sistema Interno</h1>
        <p className="text-[13px] text-zinc-500 mb-6">MilennialsTECH</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email"
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13px] mb-3 outline-none focus:border-accent/50" />
        <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="senha"
          className="w-full bg-ink-800 border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13px] mb-4 outline-none focus:border-accent/50" />
        {erro && <div className="text-[12px] text-rose-400 mb-3">{erro}</div>}
        <button disabled={carregando} className="w-full bg-accent hover:bg-accent-deep text-white rounded-lg py-2.5 text-[13px] font-medium transition disabled:opacity-50">
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
