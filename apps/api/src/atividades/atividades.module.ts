import { Module } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { AtividadesListener } from './atividades.listener';
import { AtividadesController } from './atividades.controller';

@Module({
  controllers: [AtividadesController],
  providers: [AtividadesService, AtividadesListener],
  exports: [AtividadesService],
})
export class AtividadesModule {}
