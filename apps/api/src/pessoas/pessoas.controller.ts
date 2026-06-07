import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Papel } from '@interno/shared';
import { PessoasService } from './pessoas.service';
import { JwtAuthGuard, Papeis, PapeisGuard } from '../auth';

class CriarUsuarioDto {
  @IsString() nome!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) senha!: string;
  @IsOptional() @IsEnum(Papel) papel?: Papel;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() gestorId?: string;
}

class CriarAreaDto {
  @IsString() nome!: string;
  @IsOptional() @IsString() gestorId?: string;
  @IsOptional() @IsString() paiId?: string;
}

@UseGuards(JwtAuthGuard, PapeisGuard)
@Controller('pessoas')
export class PessoasController {
  constructor(private readonly pessoas: PessoasService) {}

  @Get('usuarios')
  usuarios() {
    return this.pessoas.listarUsuarios();
  }

  @Papeis(Papel.CEO, Papel.DIRETOR)
  @Post('usuarios')
  criarUsuario(@Body() dto: CriarUsuarioDto) {
    return this.pessoas.criarUsuario(dto);
  }

  @Get('areas')
  areas() {
    return this.pessoas.listarAreas();
  }

  @Papeis(Papel.CEO, Papel.DIRETOR)
  @Post('areas')
  criarArea(@Body() dto: CriarAreaDto) {
    return this.pessoas.criarArea(dto.nome, dto.gestorId, dto.paiId);
  }

  @Get('organograma')
  organograma() {
    return this.pessoas.organograma();
  }
}
