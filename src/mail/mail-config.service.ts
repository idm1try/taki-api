import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import * as path from 'path';

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions | Promise<MailerOptions> {
    return {
      transport: {
        host: this.configService.get('mail.host'),
        port: this.configService.get('mail.port'),
        auth: {
          user: this.configService.get('mail.user'),
          pass: this.configService.get('mail.pass'),
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
