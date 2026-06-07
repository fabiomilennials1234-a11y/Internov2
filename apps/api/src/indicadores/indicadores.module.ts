import { Body, Controller, Get, Injectable, Module, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NivelIndicador, TipoDono, FonteKpi } from '@interno/shared';
import { PrismaService } from '../prisma';
import { JwtAuthGuard, Papeis, PapeisGuard } from '../auth';
import { Papel } from '@interno/shared';

// "Definir primeiro": CEO/Diretor cadastram OKR/KPI antes de alimentar (dados derivados).
@Injectable()
export class IndicadoresService {
  constructor(private readonly prisma: PrismaService) {}

  listarOkrs() {
    return this.prisma.okr.findMany({
      include: { kpis: { include: { medicoes: { orderBy: { registradoEm: 'desc' }, take: 1 } } } },
    });
  }

  definirOkr(data: { titulo: string; nivel: NivelIndicador; donoTipo: TipoDono; donoId?: string }) {
    return this.prisma.okr.create({ data });
  }

  definirKpi(data: { nome: string; okrId?: string; meta?: number; fonte: FonteKpi; donoTipo: TipoDono; donoId?: string }) {
    return this.prisma.kpi.create({ data });
  }
}

class DefinirOkrDto {
  @IsString() titulo!: string;
  @IsEnum(NivelIndicador) nivel!: NivelIndicador;
  @IsEnum(TipoDono) donoTipo!: TipoDono;
  @IsOptional() @IsString() donoId?: string;
}

@UseGuards(JwtAuthGuard, PapeisGuard)
@Controller('indicadores')
class IndicadoresController {
  constructor(private readonly ind: IndicadoresService) {}

  @Get('okrs')
  okrs() {
    return this.ind.listarOkrs();
  }

  @Papeis(Papel.CEO, Papel.DIRETOR)
  @Post('okrs')
  definir(@Body() dto: DefinirOkrDto) {
    return this.ind.definirOkr(dto);
  }
}

@Module({
  controllers: [IndicadoresController],
  providers: [IndicadoresService],
  exports: [IndicadoresService],
})
export class IndicadoresModule {}
