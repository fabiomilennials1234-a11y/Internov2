import { Body, Controller, Delete, Get, Module, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StatusParticipante } from '@interno/shared';
import { AgendaService, EntradaEvento, FILA_AGENDA } from './agenda.service';
import { AgendaProcessor, AgendaScheduler } from './agenda.processor';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

class EventoDto {
  @IsString() titulo!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() local?: string;
  @IsDateString() inicio!: string;
  @IsDateString() fim!: string;
  @IsOptional() @IsBoolean() diaInteiro?: boolean;
  @IsOptional() @IsString() rrule?: string;
  @IsOptional() @IsDateString() recorrenciaFim?: string;
  @IsOptional() @IsString() clienteId?: string;
  @IsOptional() @IsArray() participantes?: string[];
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) lembretes?: number[];
}

class CancelarOcorrenciaDto {
  @IsDateString() dataOriginal!: string;
}

class EditarOcorrenciaDto {
  @IsDateString() dataOriginal!: string;
  @IsOptional() @IsString() titulo?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() local?: string;
  @IsOptional() @IsDateString() inicio?: string;
  @IsOptional() @IsDateString() fim?: string;
  @IsOptional() @IsBoolean() diaInteiro?: boolean;
}

class RsvpDto {
  @IsIn(['CONVIDADO', 'ACEITO', 'RECUSADO', 'TALVEZ']) status!: StatusParticipante;
}

function paraEntrada(dto: EventoDto): EntradaEvento {
  return {
    titulo: dto.titulo,
    descricao: dto.descricao,
    local: dto.local,
    inicio: new Date(dto.inicio),
    fim: new Date(dto.fim),
    diaInteiro: dto.diaInteiro,
    rrule: dto.rrule ?? null,
    recorrenciaFim: dto.recorrenciaFim ? new Date(dto.recorrenciaFim) : null,
    clienteId: dto.clienteId,
    participantes: dto.participantes,
    lembretes: dto.lembretes,
  };
}

@UseGuards(JwtAuthGuard)
@Controller('agenda')
class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  // Sem usuarioId = agenda de TODOS (diretoria vê tudo). Retorna OCORRÊNCIAS (séries expandidas).
  @Get('eventos')
  eventos(@Query('de') de: string, @Query('ate') ate: string, @Query('usuarioId') usuarioId?: string) {
    return this.agenda.ocorrencias(new Date(de), new Date(ate), usuarioId);
  }

  @Post('eventos')
  criar(@Body() dto: EventoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.criar({ ...paraEntrada(dto), criadorId: u.id });
  }

  @Patch('eventos/:id')
  editar(@Param('id') id: string, @Body() dto: EventoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.editar(id, u, paraEntrada(dto));
  }

  @Delete('eventos/:id')
  excluir(@Param('id') id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.excluir(id, u);
  }

  // Cancela uma ocorrência específica de série recorrente.
  @Post('eventos/:id/cancelar-ocorrencia')
  cancelarOcorrencia(@Param('id') id: string, @Body() dto: CancelarOcorrenciaDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.cancelarOcorrencia(id, u, new Date(dto.dataOriginal));
  }

  // Edita só esta ocorrência (override). "Toda a série" usa o PATCH normal.
  @Post('eventos/:id/editar-ocorrencia')
  editarOcorrencia(@Param('id') id: string, @Body() dto: EditarOcorrenciaDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.editarOcorrencia(id, u, new Date(dto.dataOriginal), {
      titulo: dto.titulo,
      descricao: dto.descricao,
      local: dto.local,
      inicio: dto.inicio ? new Date(dto.inicio) : undefined,
      fim: dto.fim ? new Date(dto.fim) : undefined,
      diaInteiro: dto.diaInteiro,
    });
  }

  // RSVP: o usuário atual responde ao convite.
  @Post('eventos/:id/rsvp')
  rsvp(@Param('id') id: string, @Body() dto: RsvpDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.agenda.responder(id, u.id, dto.status);
  }
}

@Module({
  imports: [BullModule.registerQueue({ name: FILA_AGENDA })],
  controllers: [AgendaController],
  providers: [AgendaService, AgendaProcessor, AgendaScheduler],
  exports: [AgendaService],
})
export class AgendaModule {}
