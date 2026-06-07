import { Module } from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { PessoasController } from './pessoas.controller';

@Module({
  controllers: [PessoasController],
  providers: [PessoasService],
  exports: [PessoasService], // facade pública do módulo
})
export class PessoasModule {}
