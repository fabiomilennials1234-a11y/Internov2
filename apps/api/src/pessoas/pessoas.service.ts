import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { EVENTOS, Papel, UsuarioCriadoEvento } from '@interno/shared';
import { PrismaService } from '../prisma';

interface CriarUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  papel?: Papel;
  areaId?: string;
  gestorId?: string;
}

@Injectable()
export class PessoasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
  ) {}

  listarUsuarios() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, papel: true, areaId: true, gestorId: true, avatarCor: true, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async criarUsuario(input: CriarUsuarioInput) {
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash: await argon2.hash(input.senha),
        papel: input.papel ?? Papel.FUNCIONARIO,
        areaId: input.areaId,
        gestorId: input.gestorId,
      },
    });
    this.eventos.emit(EVENTOS.USUARIO_CRIADO, {
      usuarioId: usuario.id,
      nome: usuario.nome,
      papel: usuario.papel,
      areaId: usuario.areaId,
    } satisfies UsuarioCriadoEvento);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
  }

  listarAreas() {
    return this.prisma.area.findMany({ include: { gestor: { select: { id: true, nome: true } } } });
  }

  criarArea(nome: string, gestorId?: string, paiId?: string) {
    return this.prisma.area.create({ data: { nome, gestorId, paiId } });
  }

  // Organograma: árvore de áreas (CEO/Diretores no topo via área raiz).
  async organograma() {
    const areas = await this.prisma.area.findMany({
      include: {
        gestor: { select: { id: true, nome: true, papel: true } },
        membros: { select: { id: true, nome: true, papel: true } },
      },
    });
    const porPai = new Map<string | null, typeof areas>();
    for (const a of areas) {
      const k = a.paiId ?? null;
      if (!porPai.has(k)) porPai.set(k, []);
      porPai.get(k)!.push(a);
    }
    const montar = (paiId: string | null): unknown =>
      (porPai.get(paiId) ?? []).map((a) => ({ ...a, filhas: montar(a.id) }));
    return montar(null);
  }
}
