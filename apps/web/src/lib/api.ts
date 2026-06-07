import { useAuth } from '@/store/auth';

const BASE = '/api';

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    useAuth.getState().logout();
    throw new Error('Não autenticado');
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? `Erro ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}
