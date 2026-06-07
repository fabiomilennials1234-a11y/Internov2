import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './prisma';
import { RealtimeModule } from './realtime';
import { AuthModule } from './auth';
import { PessoasModule } from './pessoas';
import { ClientesModule } from './clientes';
import { AtividadesModule } from './atividades';
import { ComunicacaoModule } from './comunicacao';
import { ProjetosModule } from './projetos';
import { AgendaModule } from './agenda';
import { IndicadoresModule } from './indicadores';
import { DashboardsModule } from './dashboards';
import { MacrosModule } from './macros';
import { NotificacoesModule } from './notificacoes';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(), // event bus in-process — fronteira entre módulos
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    PessoasModule,
    ClientesModule,
    AtividadesModule,
    ComunicacaoModule,
    ProjetosModule,
    AgendaModule,
    IndicadoresModule,
    DashboardsModule,
    MacrosModule,
    NotificacoesModule,
  ],
})
export class AppModule {}
