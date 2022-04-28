import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let mailerService: MailerService;
  const mockEmail = 'test@gmail.com';
  const mockName = 'Test';
  let spyMailerSendMail: jest.SpiedFunction<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => `${key}-mock-value`),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
    mailerService = module.get<MailerService>(MailerService);

    spyMailerSendMail = jest.spyOn(mailerService, 'sendMail');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signupSuccess should send email', async () => {
    await service.signupSuccess(mockEmail, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Signup Account Success',
      subject: 'Signup Account Success',
      template: '/main',
      context: {
        title: 'Signup Account Success',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''}`,
        text2: 'Your registration is complete',
        description: 'Click on the button bellow to redirect to log in page.',
        hasAction: true,
        url: configService.get('mail.callbackLoginUrl'),
        buttonLabel: 'Login',
      },
    });
  });

  it('updatePasswordSuccess should send email', async () => {
    await service.updatePasswordSuccess(mockEmail, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Update Password Success',
      subject: 'Update Password Success',
      template: '/main',
      context: {
        title: 'Update Password Success',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''},`,
        text2: 'Update your password success',
        description: 'Click on the button bellow to redirect to log in page.',
        hasAction: true,
        url: configService.get('mail.callbackLoginUrl'),
        buttonLabel: 'Login',
      },
    });
  });

  it('deleteAccountSuccess should send email', async () => {
    await service.deleteAccountSuccess(mockEmail, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Deleted Account',
      subject: 'Deleted Account',
      template: '/main',
      context: {
        title: 'Deleted Account',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Goodbye ${mockName || ''}`,
        text2: 'Your account was deleted!',
        description: `Thank you for being a part of ${configService.get(
          'app.name',
        )}.`,
        hasAction: false,
      },
    });
  });

  it('verifyEmail should send email', async () => {
    const mockVerifyKey = 'verify-key';
    await service.verifyEmail(mockEmail, mockVerifyKey, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Verify Email',
      subject: 'Verify Email',
      template: '/main',
      context: {
        title: 'Verify Email',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''}`,
        text2: 'Verify your email address',
        description:
          'Simply click on the button below to verify your email address.',
        hasAction: true,
        url: `${configService.get(
          'mail.callbackVerifyUrl',
        )}?verifyKey=${mockVerifyKey}`,
        buttonLabel: 'Verify',
      },
    });
  });

  it('verifyEmailSuccess should send email', async () => {
    await service.verifyEmailSuccess(mockEmail, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Verify Email Success',
      subject: 'Verify Email Success',
      template: '/main',
      context: {
        title: 'Verify Email Success',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''}`,
        text2: 'Verify account success!',
        description: 'Your account is verified.',
        hasAction: false,
      },
    });
  });

  it('forgotPassword should send email', async () => {
    const mockResetPasswordKey = 'valid-key';

    await service.forgotPassword(mockEmail, mockResetPasswordKey, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Reset Password',
      subject: 'Reset Password',
      template: '/main',
      context: {
        title: 'Reset Password',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''}`,
        text2: 'Forgot you password?',
        description:
          "That's okay, it happens! Click on the button below to reset your password.",
        hasAction: true,
        url: `${configService.get(
          'mail.callbackResetUrl',
        )}?forgotPasswordKey=${mockResetPasswordKey}`,
        buttonLabel: 'Reset Password',
      },
    });
  });

  it('resetPasswordSuccess should send email', async () => {
    await service.resetPasswordSuccess(mockEmail, mockName);

    expect(spyMailerSendMail).toBeCalledWith({
      to: mockEmail,
      text: 'Reset Password Success',
      subject: 'Reset Password Success',
      template: '/main',
      context: {
        title: 'Reset Password Success',
        logoUrl: configService.get('mail.logoUrl'),
        appName: configService.get('app.name'),
        text1: `Hello ${mockName || ''}`,
        text2: 'Reset your password success',
        description: 'Click on the button below to redirect to login page.',
        hasAction: true,
        url: configService.get('mail.callbackLoginUrl'),
        buttonLabel: 'Login',
      },
    });
  });
});
