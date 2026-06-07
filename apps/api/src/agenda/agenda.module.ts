import { Controller, Get, Module, Query, UseGuards } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth';

@UseGuards(JwtAuthGuard)
@Controller('agenda')
class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get('eventos')
  eventos(@Query('de') de: string, @Query('ate') ate: string, @Query('usuarioId') usuarioId?: string) {
    return this.agenda.eventos_(new Date(de), new Date(ate), usuarioId);
  }
}

@Module({
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
