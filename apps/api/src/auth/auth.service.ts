import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) throw new UnauthorizedException('Credenciais inválidas');
    const ok = await argon2.verify(usuario.senhaHash, senha);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return this.emitirTokens(usuario.id, usuario.papel);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; papel: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh inválido');
    }
    const hash = await argon2.hash(refreshToken);
    const guardado = await this.prisma.refreshToken.findFirst({
      where: { usuarioId: payload.sub, revogado: false, expiraEm: { gt: new Date() } },
      orderBy: { criadoEm: 'desc' },
    });
    if (!guardado || !(await argon2.verify(guardado.tokenHash, refreshToken))) {
      throw new UnauthorizedException('Refresh inválido');
    }
    void hash;
    return this.emitirTokens(payload.sub, payload.papel);
  }

  private async emitirTokens(sub: string, papel: string) {
    const accessToken = await this.jwt.signAsync(
      { sub, papel },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, papel },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: (process.env.JWT_REFRESH_TTL ?? '30d') as never },
    );
    const expiraEm = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await this.prisma.refreshToken.create({
      data: { usuarioId: sub, tokenHash: await argon2.hash(refreshToken), expiraEm },
    });
    return { accessToken, refreshToken };
  }
}
