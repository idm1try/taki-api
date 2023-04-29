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
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Signup Account Success',
            subject: 'Signup Account Success',
            template: 'main',
            context: {
                title: 'Signup Account Success',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''}`,
                text2: 'Your registration is complete',
                description:
                    'Click on the button bellow to redirect to log in page.',
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
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Update Password Success',
            subject: 'Update Password Success',
            template: 'main',
            context: {
                title: 'Update Password Success',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''},`,
                text2: 'Update your password success',
                description:
                    'Click on the button bellow to redirect to log in page.',
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
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Deleted Account',
            subject: 'Deleted Account',
            template: 'main',
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

    public async verifyEmail(
        email: string,
        key: string,
        name?: string,
    ): Promise<void> {
        return this.mailerService.sendMail({
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Verify Email',
            subject: 'Verify Email',
            template: 'main',
            context: {
                title: 'Verify Email',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''}`,
                text2: 'Verify your email address',
                description:
                    'Simply click on the button below to verify your email address.',
                hasAction: true,
                url: `${this.configService.get(
                    'mail.callbackVerifyUrl',
                )}?verifyKey=${key}`,
                buttonLabel: 'Verify',
            },
        });
    }

    public async verifyEmailSuccess(
        email: string,
        name?: string,
    ): Promise<void> {
        return this.mailerService.sendMail({
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Verify Email Success',
            subject: 'Verify Email Success',
            template: 'main',
            context: {
                title: 'Verify Email Success',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''}`,
                text2: 'Verify account success!',
                description: 'Your account is verified.',
                hasAction: false,
            },
        });
    }

    public async forgotPassword(
        email: string,
        key: string,
        name?: string,
    ): Promise<void> {
        return this.mailerService.sendMail({
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Reset Password',
            subject: 'Reset Password',
            template: 'main',
            context: {
                title: 'Reset Password',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''}`,
                text2: 'Forgot you password?',
                description:
                    "That's okay, it happens! Click on the button below to reset your password.",
                hasAction: true,
                url: `${this.configService.get(
                    'mail.callbackResetUrl',
                )}?resetPasswordKey=${key}`,
                buttonLabel: 'Reset Password',
            },
        });
    }

    public async resetPasswordSuccess(
        email: string,
        name?: string,
    ): Promise<void> {
        return this.mailerService.sendMail({
            from: this.configService.get<string>('mail.rootEmail'),
            to: email,
            text: 'Reset Password Success',
            subject: 'Reset Password Success',
            template: 'main',
            context: {
                title: 'Reset Password Success',
                logoUrl: this.configService.get('mail.logoUrl'),
                appName: this.configService.get('app.name'),
                text1: `Hello ${name || ''}`,
                text2: 'Reset your password success',
                description:
                    'Click on the button below to redirect to login page.',
                hasAction: true,
                url: this.configService.get('mail.callbackLoginUrl'),
                buttonLabel: 'Login',
            },
        });
    }
}
