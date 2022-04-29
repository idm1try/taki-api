import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Facebook } from 'fb';
import { FacebookAccountInfo } from './auth-facebook.type';

@Injectable()
export class AuthFacebookService {
  private fb: Facebook;

  constructor(private readonly configService: ConfigService) {
    this.fb = new Facebook({
      appId: this.configService.get<string>('facebook.clientId'),
      appSecret: this.configService.get<string>('facebook.clientSecret'),
      version: 'v7.0',
    });
  }

  public async verify(
    accessToken: string,
  ): Promise<FacebookAccountInfo | undefined> {
    try {
      this.fb.setAccessToken(accessToken);
      const userInfo = await this.fb.api('me', {
        fields: ['id', 'name', 'email'],
      });

      // Revoke facebook access token after get info for security
      await this.fb.api('/me/permissions', 'delete');
      return userInfo as FacebookAccountInfo;
    } catch (error) {
      return undefined;
    }
  }
}
