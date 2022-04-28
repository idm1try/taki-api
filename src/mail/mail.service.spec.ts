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
});
