import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { ProjetosService } from './projetos.service';
import { JwtAuthGuard } from '../auth';

class CriarBoardDto {
  @IsString() donoId!: string;
  @IsString() nome!: string;
  @IsArray() colunas!: string[];
}

class CriarTarefaDto {
  @IsString() boardId!: string;
  @IsString() colunaId!: string;
  @IsString() titulo!: string;
  @IsOptional() @IsString() responsavelId?: string;
  @IsOptional() @IsString() projetoId?: string;
}

class MoverDto {
  @IsString() colunaId!: string;
  @IsInt() ordem!: number;
}

@UseGuards(JwtAuthGuard)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetos: ProjetosService) {}

  @Get('boards')
  boards(@Query('donoId') donoId: string) {
    return this.projetos.boardsDoDono(donoId);
  }

  @Post('boards')
  criarBoard(@Body() dto: CriarBoardDto) {
    return this.projetos.criarBoard(dto.donoId, dto.nome, dto.colunas);
  }

  @Post('tarefas')
  criarTarefa(@Body() dto: CriarTarefaDto) {
    return this.projetos.criarTarefa(dto);
  }

  @Patch('tarefas/:id/mover')
  mover(@Param('id') id: string, @Body() dto: MoverDto) {
    return this.projetos.moverTarefa(id, dto.colunaId, dto.ordem);
  }
}
