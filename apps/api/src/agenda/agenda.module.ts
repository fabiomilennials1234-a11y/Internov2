import { Body, Controller, Get, Module, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

class CriarEventoDto {
  @IsString() titulo!: string;
  @IsDateString() inicio!: string;
  @IsDateString() fim!: string;
  @IsOptional() @IsString() clienteId?: string;
  @IsOptional() @IsArray() participantes?: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('agenda')
class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  // Sem usuarioId = agenda de TODOS (diretoria vê tudo).
  @Get('eventos')
  eventos(@Query('de') de: string, @Query('ate') ate: string, @Query('usuarioId') usuarioId?: string) {
    return this.agenda.eventos_(new Date(de), new Date(ate), usuarioId);
  }

  @Post('eventos')
  criar(@Body() dto: CriarEventoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.criar({
      titulo: dto.titulo,
      inicio: new Date(dto.inicio),
      fim: new Date(dto.fim),
      criadorId: u.id,
      clienteId: dto.clienteId,
      participantes: dto.participantes ?? [u.id],
    });
  }
}

@Module({
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
