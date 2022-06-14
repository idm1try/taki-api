import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Auth, google } from 'googleapis';

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  private clientId: string;
  private clientSecret: string;
  private oauth2Client: Auth.OAuth2Client;
  private accessToken: any;
  private refreshToken: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('mail.auth.clientId');
    this.clientSecret = this.configService.get<string>(
      'mail.auth.clientSecret',
    );
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.configService.get<string>('mail.auth.redirectUri'),
    );
    this.refreshToken = this.configService.get<string>(
      'mail.auth.refreshToken',
    );
    this.oauth2Client.setCredentials({
      refresh_token: this.refreshToken,
    });
    this.accessToken = this.oauth2Client
      .getAccessToken()
      .then((token) => token);
  }

  createMailerOptions(): MailerOptions | Promise<MailerOptions> {
    return {
      transport: {
        host: this.configService.get<string>('mail.host'),
        port: this.configService.get<string>('mail.port'),
        auth: {
          type: this.configService.get<string>('mail.auth.type'),
          user: this.configService.get<string>('mail.auth.user'),
          accessToken: this.accessToken,
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          refreshToken: this.refreshToken,
        },
      },
      template: {
        dir: path.join(
          this.configService.get('app.workdir'),
          'src',
          'mail',
          'templates',
        ),
        adapter: new PugAdapter(),
        options: {
          strict: true,
        },
      },
    } as MailerOptions;
  }
}
