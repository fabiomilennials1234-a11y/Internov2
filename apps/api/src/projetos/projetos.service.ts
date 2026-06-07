import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTOS, TarefaAtribuidaEvento } from '@interno/shared';
import { PrismaService } from '../prisma';

@Injectable()
export class ProjetosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventEmitter2,
  ) {}

  // Kanban do diretor: board com colunas custom + tarefas por coluna.
  boardsDoDono(donoId: string) {
    return this.prisma.board.findMany({
      where: { donoId },
      include: {
        colunas: {
          orderBy: { ordem: 'asc' },
          include: {
            tarefas: {
              orderBy: { ordem: 'asc' },
              include: { responsavel: { select: { id: true, nome: true, avatarCor: true } } },
            },
          },
        },
      },
    });
  }

  async criarBoard(donoId: string, nome: string, colunas: string[]) {
    return this.prisma.board.create({
      data: {
        donoId,
        nome,
        colunas: { create: colunas.map((c, i) => ({ nome: c, ordem: i })) },
      },
      include: { colunas: true },
    });
  }

  adicionarColuna(boardId: string, nome: string, ordem: number) {
    return this.prisma.colunaBoard.create({ data: { boardId, nome, ordem } });
  }

  async criarTarefa(input: {
    boardId: string;
    colunaId: string;
    titulo: string;
    responsavelId?: string;
    projetoId?: string;
    prazo?: Date;
  }) {
    const tarefa = await this.prisma.tarefa.create({ data: input });
    if (input.responsavelId) {
      const projeto = input.projetoId
        ? await this.prisma.projeto.findUnique({ where: { id: input.projetoId } })
        : null;
      this.eventos.emit(EVENTOS.TAREFA_ATRIBUIDA, {
        tarefaId: tarefa.id,
        boardId: input.boardId,
        responsavelId: input.responsavelId,
        clienteId: projeto?.clienteId ?? null,
      } satisfies TarefaAtribuidaEvento);
    }
    return tarefa;
  }

  moverTarefa(tarefaId: string, colunaId: string, ordem: number) {
    return this.prisma.tarefa.update({ where: { id: tarefaId }, data: { colunaId, ordem } });
  }
}
