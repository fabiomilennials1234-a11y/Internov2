import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TipoFrente, StatusFrente } from '@interno/shared';
import { ProjetosService } from './projetos.service';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

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

class CriarFrenteDto {
  @IsString() clienteId!: string;
  @IsString() nome!: string;
  @IsEnum(TipoFrente) frente!: TipoFrente;
  @IsOptional() @IsString() responsavelId?: string;
}

class AtualizarFrenteDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() responsavelId?: string;
  @IsOptional() @IsEnum(StatusFrente) status?: StatusFrente;
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

  @Post('frentes')
  criarFrente(@Body() dto: CriarFrenteDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.projetos.criarFrente(dto, u.id);
  }

  @Patch('frentes/:id')
  atualizarFrente(@Param('id') id: string, @Body() dto: AtualizarFrenteDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.projetos.atualizarFrente(id, dto, u.id);
  }

  @Patch('tarefas/:id/mover')
  mover(@Param('id') id: string, @Body() dto: MoverDto) {
    return this.projetos.moverTarefa(id, dto.colunaId, dto.ordem);
  }
}
