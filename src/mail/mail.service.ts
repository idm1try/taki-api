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

  public async updatePasswordSuccess(
    email: string,
    name?: string,
  ): Promise<void> {
    return this.mailerService.sendMail({
      to: email,
      text: 'Update Password Success',
      subject: 'Update Password Success',
      template: '/main',
      context: {
        title: 'Update Password Success',
        logoUrl: this.configService.get('mail.logoUrl'),
        appName: this.configService.get('app.name'),
        text1: `Hello ${name || ''},`,
        text2: 'Update your password success',
        description: 'Click on the button bellow to redirect to log in page.',
        hasAction: true,
        url: this.configService.get('mail.callbackLoginUrl'),
        buttonLabel: 'Login',
      },
    });
  }

  public async deleteAccountSuccess(
    email: string,
    name?: string,
  ): Promise<void> {
    return this.mailerService.sendMail({
      to: email,
      text: 'Deleted Account',
      subject: 'Deleted Account',
      template: '/main',
      context: {
        title: 'Deleted Account',
        logoUrl: this.configService.get('mail.logoUrl'),
        appName: this.configService.get('app.name'),
        text1: `Goodbye ${name || ''}`,
        text2: 'Your account was deleted!',
        description: `Thank you for being a part of ${this.configService.get(
          'app.name',
        )}.`,
        hasAction: false,
      },
    });
  }
}
