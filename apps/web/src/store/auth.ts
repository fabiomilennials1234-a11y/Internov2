import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: string;
  papel: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      async login(email, senha) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });
        if (!res.ok) throw new Error('Credenciais inválidas');
        const { accessToken, refreshToken } = await res.json();
        const eu = await fetch('/api/auth/eu', { headers: { Authorization: `Bearer ${accessToken}` } }).then((r) => r.json());
        set({ accessToken, refreshToken, usuario: eu });
      },
      logout() {
        set({ accessToken: null, refreshToken: null, usuario: null });
      },
    }),
    { name: 'interno-auth' },
  ),
);
