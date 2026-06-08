import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EVENTOS,
  TarefaAtribuidaEvento,
  TipoFrente,
  StatusFrente,
  ProjetoVinculadoClienteEvento,
  FrenteStatusAlteradoEvento,
} from '@interno/shared';
import { PrismaService } from '../prisma';
import { transicaoPermitida } from './status-frente';

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

  // Frente = Projeto vinculado a Cliente (tipo CLIENTE). Facade pública: clientes
  // não escreve Projeto direto. Status nasce ATIVA; emite evento p/ o feed do card.
  async criarFrente(
    input: { clienteId: string; nome: string; frente: TipoFrente; responsavelId?: string },
    atorId?: string,
  ) {
    const projeto = await this.prisma.projeto.create({
      data: {
        nome: input.nome,
        tipo: 'CLIENTE',
        frente: input.frente,
        clienteId: input.clienteId,
        responsavelId: input.responsavelId,
      },
      include: { responsavel: { select: { id: true, nome: true, avatarCor: true } } },
    });
    this.eventos.emit(EVENTOS.PROJETO_VINCULADO_CLIENTE, {
      projetoId: projeto.id,
      clienteId: input.clienteId,
      nome: projeto.nome,
      frente: projeto.frente,
      atorId,
    } satisfies ProjetoVinculadoClienteEvento);
    return projeto;
  }

  // Atualiza nome/responsável/status da Frente. Mudança de status passa pela
  // máquina de estados; transição inválida é rejeitada. Status mudou → evento no feed.
  async atualizarFrente(
    id: string,
    dados: { nome?: string; responsavelId?: string | null; status?: StatusFrente },
    atorId?: string,
  ) {
    const atual = await this.prisma.projeto.findUniqueOrThrow({ where: { id } });
    const mudouStatus = dados.status !== undefined && dados.status !== atual.status;
    if (mudouStatus && !transicaoPermitida(atual.status, dados.status!)) {
      throw new BadRequestException(`Transição de status inválida: ${atual.status} → ${dados.status}`);
    }
    const projeto = await this.prisma.projeto.update({
      where: { id },
      data: { nome: dados.nome, responsavelId: dados.responsavelId, status: dados.status },
      include: { responsavel: { select: { id: true, nome: true, avatarCor: true } } },
    });
    if (mudouStatus && atual.clienteId) {
      this.eventos.emit(EVENTOS.FRENTE_STATUS_ALTERADO, {
        projetoId: projeto.id,
        clienteId: atual.clienteId,
        nome: projeto.nome,
        status: projeto.status,
        atorId,
      } satisfies FrenteStatusAlteradoEvento);
    }
    return projeto;
  }
}
