import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { EstagioEntrega } from '@interno/shared';
import { PrismaService } from '../prisma';
import { JwtAuthGuard } from '../auth';

// TV-Dashboard: agrega KPIs/indicadores chave. Atualização ao vivo via realtime (gateway).
@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async resumoTv() {
    const [clientesAtivos, emRisco] = await Promise.all([
      this.prisma.cliente.count(),
      this.prisma.cliente.count({ where: { estagioEntrega: EstagioEntrega.EM_RISCO } }),
    ]);
    return { clientesAtivos, emRisco };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('dashboards')
class DashboardsController {
  constructor(private readonly dash: DashboardsService) {}

  @Get('tv')
  tv() {
    return this.dash.resumoTv();
  }
}

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService],
  exports: [DashboardsService],
})
export class DashboardsModule {}
