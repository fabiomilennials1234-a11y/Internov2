import { Module } from '@nestjs/common';
import { ComunicacaoService } from './comunicacao.service';
import { ComunicacaoController } from './comunicacao.controller';

@Module({
  controllers: [ComunicacaoController],
  providers: [ComunicacaoService],
  exports: [ComunicacaoService],
})
export class ComunicacaoModule {}
