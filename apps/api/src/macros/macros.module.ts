import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { JwtAuthGuard } from '../auth';

// Fase 2. Ações/atalhos reutilizáveis (templates de msg, ações rápidas). Modelo extensível.
@Injectable()
export class MacrosService {
  constructor(private readonly prisma: PrismaService) {}
  listar() {
    return this.prisma.macro.findMany();
  }
}

@UseGuards(JwtAuthGuard)
@Controller('macros')
class MacrosController {
  constructor(private readonly macros: MacrosService) {}
  @Get()
  listar() {
    return this.macros.listar();
  }
}

@Module({
  controllers: [MacrosController],
  providers: [MacrosService],
  exports: [MacrosService],
})
export class MacrosModule {}
