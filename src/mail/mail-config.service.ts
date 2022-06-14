import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions | Promise<MailerOptions> {
    return {
      transport: {
        host: this.configService.get<string>('mail.host'),
        port: this.configService.get<string>('mail.port'),
        auth: {
          type: 'OAuth2',
          user: this.configService.get<string>('mail.mail'),
          accessToken: this.configService.get<string>('mail.accessToken'),
          clientId: this.configService.get<string>('mail.clientId'),
          clientSecret: this.configService.get<string>('mail.secret'),
          refreshToken: this.configService.get<string>('mail.refreshToken'),
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
