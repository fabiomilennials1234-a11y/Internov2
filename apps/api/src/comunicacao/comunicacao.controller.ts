import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMencao } from '@interno/shared';
import { ComunicacaoService } from './comunicacao.service';
import { JwtAuthGuard, UsuarioAtual } from '../auth';
import type { UsuarioAutenticado } from '../auth';

class MencaoDto {
  @IsEnum(TipoMencao) tipo!: TipoMencao;
  @IsString() alvoId!: string;
}

class EnviarDto {
  @IsString() conteudo!: string;
  @IsOptional() @IsString() threadPaiId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MencaoDto) mencoes?: MencaoDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('comunicacao')
export class ComunicacaoController {
  constructor(private readonly com: ComunicacaoService) {}

  @Get('canais')
  canais() {
    return this.com.listarCanais();
  }

  @Get('canais/:id/mensagens')
  mensagens(@Param('id') id: string) {
    return this.com.mensagensDoCanal(id);
  }

  @Post('canais/:id/mensagens')
  enviar(@Param('id') id: string, @Body() dto: EnviarDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.com.enviar({ canalId: id, autorId: u.id, ...dto });
  }
}
