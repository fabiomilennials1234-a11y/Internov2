import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Papel } from '@interno/shared';

export const JwtAuthGuard = AuthGuard('jwt');

export const PAPEIS_KEY = 'papeis';
export const Papeis = (...papeis: Papel[]) => SetMetadata(PAPEIS_KEY, papeis);

// RBAC por papel. MVP: CEO/Diretores têm visão global (não restringimos entre diretores).
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Papel[]>(PAPEIS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!exigidos || exigidos.length === 0) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return exigidos.includes(user?.papel);
  }
}

export const UsuarioAtual = createParamDecorator((_data, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});
