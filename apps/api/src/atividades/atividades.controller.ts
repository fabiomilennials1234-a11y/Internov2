import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { JwtAuthGuard } from '../auth';

@UseGuards(JwtAuthGuard)
@Controller('atividades')
export class AtividadesController {
  constructor(private readonly atividades: AtividadesService) {}

  @Get('cliente/:id')
  doCliente(@Param('id') id: string) {
    return this.atividades.feedDoCliente(id);
  }

  @Get('pessoa/:id')
  daPessoa(@Param('id') id: string) {
    return this.atividades.feedDaPessoa(id);
  }
}
