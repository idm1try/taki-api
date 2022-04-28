import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('auth.jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any): any {
    const refreshToken = req?.get('authorization')?.split(' ')[1];

    if (!refreshToken) throw new ForbiddenException('refresh token malformed');

    return {
      ...payload,
      refreshToken,
    };
  }
}
