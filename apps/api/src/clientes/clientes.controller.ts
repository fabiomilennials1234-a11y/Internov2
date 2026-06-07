import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstagioEntrega } from '@interno/shared';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

class CriarClienteDto {
  @IsString() nome!: string;
  @IsOptional() @IsString() emoji?: string;
  @IsOptional() @IsString() responsavelId?: string;
  @IsOptional() @IsInt() valorMensal?: number;
}

class EstagioDto {
  @IsEnum(EstagioEntrega) estagio!: EstagioEntrega;
}

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar() {
    return this.clientes.listar();
  }

  @Get(':id')
  card(@Param('id') id: string) {
    return this.clientes.card(id);
  }

  @Post()
  criar(@Body() dto: CriarClienteDto) {
    return this.clientes.criar(dto);
  }

  @Patch(':id/estagio')
  estagio(@Param('id') id: string, @Body() dto: EstagioDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.clientes.mudarEstagio(id, dto.estagio, u.id);
  }
}
