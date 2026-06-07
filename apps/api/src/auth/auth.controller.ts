import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard, UsuarioAtual } from './rbac';
import type { UsuarioAutenticado } from './jwt.strategy';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) senha!: string;
}

class RefreshDto {
  @IsString() refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.senha);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('eu')
  eu(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
