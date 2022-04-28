import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  public async signupSuccess(email: string, name?: string): Promise<void> {
    return this.mailerService.sendMail({
      to: email,
      text: 'Signup Account Success',
      subject: 'Signup Account Success',
      template: '/main',
      context: {
        title: 'Signup Account Success',
        logoUrl: this.configService.get('mail.logoUrl'),
        appName: this.configService.get('app.name'),
        text1: `Hello ${name || ''}`,
        text2: 'Your registration is complete',
        description: 'Click on the button bellow to redirect to log in page.',
        hasAction: true,
        url: this.configService.get('mail.callbackLoginUrl'),
        buttonLabel: 'Login',
      },
    });
  }
}
