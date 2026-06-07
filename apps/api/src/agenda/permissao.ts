import { Papel } from '@interno/shared';

/** Edita/exclui evento: o criador, ou qualquer diretoria (CEO/Diretor). Ver grilling Agenda. */
export function podeGerenciarEvento(
  usuario: { id: string; papel: string },
  evento: { criadorId: string },
): boolean {
  if (usuario.id === evento.criadorId) return true;
  return usuario.papel === Papel.CEO || usuario.papel === Papel.DIRETOR;
}
