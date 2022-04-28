import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/users.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { KeysService } from '../keys/keys.service';
import { MailService } from '../mail/mail.service';
import { createMockFromClass } from '../../test/utils/createMockFromClass';
import { Hashing } from '../utils';
import { UserProfileSerialization } from '../users/serializations/user-profile.serialization';
import { Key } from '../keys/keys.schema';

const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userService: UsersService;
  let mailService: MailService;
  let keysService: KeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: createMockFromClass(UsersService),
        },
        {
          provide: ConfigService,
          useValue: createMockFromClass(ConfigService),
        },
        {
          provide: JwtService,
          useValue: createMockFromClass(JwtService),
        },
        {
          provide: KeysService,
          useValue: createMockFromClass(KeysService),
        },
        {
          provide: MailService,
          useValue: createMockFromClass(MailService),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);
    keysService = module.get<KeysService>(KeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should return tokens', async () => {
      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const payload = { userId: '1' };
      const tokens = await service.generateTokens(payload);

      expect(spyJwtSign).toHaveBeenNthCalledWith(
        1,
        {
          userId: '1',
        },
        {
          secret: configService.get('auth.jwt.accessSecret'),
          expiresIn: 60 * 15,
        },
      );
      expect(spyJwtSign).toHaveBeenNthCalledWith(
        2,
        {
          userId: '1',
        },
        {
          secret: configService.get('auth.jwt.refreshSecret'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      );

      expect(tokens).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
      });
    });
  });

  describe('signup', () => {
    it('should throw error when email already used', async () => {
      const user = createUserDoc({
        name: 'Test Name',
        email: 'test@gmail.com',
        password: 'secret',
      });

      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, password: 'hashed-secret' } as User);

      try {
        await service.signup({
          name: user.name,
          email: user.email,
          password: user.password,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.CONFLICT,
          errors: {
            email: 'email is already used',
          },
        });
      }
    });

    it('should send email and return tokens when signup success', async () => {
      const user = createUserDoc({
        name: 'Test Name',
        email: 'test@gmail.com',
        password: 'secret',
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(undefined);

      const spyUserServiceCreate = jest
        .spyOn(userService, 'create')
        .mockResolvedValueOnce({ ...user, password: 'hashed-secret' } as User);

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({
          ...user,
          password: 'hashed-secret',
          refreshToken: 'hashed-rt',
        } as User);

      const spyMailSignupSuccess = jest.spyOn(mailService, 'signupSuccess');

      const response = await service.signup({
        name: user.name,
        email: user.email,
        password: user.password,
      });

      expect(response).toEqual({
        data: {
          accessToken: 'at',
          refreshToken: 'rt',
        },
        message: 'signup success',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({
        email: user.email,
      });
      expect(spyUserServiceCreate).toBeCalledWith({
        name: user.name,
        email: user.email,
        password: user.password,
      });
      expect(spyJwtSign).toHaveBeenNthCalledWith(
        1,
        {
          userId: user._id,
        },
        {
          secret: configService.get('auth.jwt.accessSecret'),
          expiresIn: 60 * 15,
        },
      );
      expect(spyJwtSign).toHaveBeenNthCalledWith(
        2,
        {
          userId: user._id,
        },
        {
          secret: configService.get('auth.jwt.refreshSecret'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      );

      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        {
          refreshToken: 'rt',
        },
      );
      expect(spyMailSignupSuccess).toBeCalledWith(user.email, user.name);
    });
  });

  describe('signin', () => {
    it('should throw error when email is not exist', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

      try {
        await service.signin({
          email: 'notexist@gmail.com',
          password: 'wrong',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);

        expect(error.response).toEqual({
          status: HttpStatus.BAD_REQUEST,
          errors: {
            email: 'email is not exist',
          },
        });
      }
    });

    it('should throw error when password invalid', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'secret',
      });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
        ...user,
        password: await Hashing.hash(user.password),
      } as User);

      try {
        await service.signin({
          email: user.email,
          password: 'not-secret',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.BAD_REQUEST,
          errors: {
            password: 'incorect password',
          },
        });
      }
    });

    it('should return tokens when signin success', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'secret',
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({
          ...user,
          password: await Hashing.hash(user.password),
        } as User);

      jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, refreshToken: 'hashed-rt' } as User);

      const response = await service.signin({
        email: user.email,
        password: user.password,
      });

      expect(response).toEqual({
        data: {
          accessToken: 'at',
          refreshToken: 'rt',
        },
        message: 'signin success',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({
        email: user.email,
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: '1' },
        { refreshToken: 'rt' },
      );
    });
  });

  describe('refreshTokens', () => {
    it('should throw error if user or refreshToken does exist', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(createUserDoc() as User);

      try {
        await service.refreshTokens('1', 'invalid-refresh-token');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.UNAUTHORIZED,
          errors: {
            accessToken: 'access denied',
          },
        });
      }
    });

    it('should throw error if refreshToken not match', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
        createUserDoc({
          refreshToken: await Hashing.hash('rt'),
        }) as User,
      );
      try {
        await service.refreshTokens('1', 'invalid-refresh-token');
      } catch (error) {
        expect(error.response).toEqual({
          status: HttpStatus.UNAUTHORIZED,
          errors: {
            accessToken: 'invalid refreshToken',
          },
        });
      }
    });

    it('should return tokens if refreshToken valid', async () => {
      const user = createUserDoc({ _id: '1', email: 'test@gmail.com' });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(
          createUserDoc({
            refreshToken: await Hashing.hash('rt'),
          }) as User,
        );

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('new-at' as never)
        .mockResolvedValueOnce('new-rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(
          createUserDoc({ refreshToken: 'hashed-new-rt' }) as User,
        );

      const response = await service.refreshTokens(user._id, 'rt');

      expect(response).toEqual({
        data: {
          accessToken: 'new-at',
          refreshToken: 'new-rt',
        },
        message: 'refresh new tokens success',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyJwtSign).toHaveBeenNthCalledWith(
        1,
        {
          userId: user._id,
        },
        {
          secret: configService.get('auth.jwt.accessSecret'),
          expiresIn: 60 * 15,
        },
      );
      expect(spyJwtSign).toHaveBeenNthCalledWith(
        2,
        {
          userId: user._id,
        },
        {
          secret: configService.get('auth.jwt.refreshSecret'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      );
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        {
          refreshToken: 'new-rt',
        },
      );
    });
  });

  describe('accountInfo', () => {
    it('should throw error when userId not found', async () => {
      jest.spyOn(userService, 'getUserInfo').mockReturnValueOnce(undefined);

      try {
        await service.accountInfo('not-exist-id');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.FORBIDDEN,
          errors: {
            accessToken: 'invalid accessToken',
          },
        });
      }
    });

    it('should return account info without password and refreshTokens fields', async () => {
      const user = createUserDoc({
        name: 'Test Name',
        email: 'test@gmail.com',
        password: 'secret',
        refreshToken: 'rt',
      });

      const spyUserServiceGetUserInfo = jest
        .spyOn(userService, 'getUserInfo')
        .mockResolvedValueOnce({
          _id: user._id,
          name: user.name,
          email: user.email,
        } as UserProfileSerialization);

      const result = await service.accountInfo(user._id);
      expect(result).toEqual({
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        message: 'get account info success',
      });
      expect(spyUserServiceGetUserInfo).toBeCalledWith(user._id);
    });
  });

  describe('updatePassword', () => {
    it('should update new password and send email notification', async () => {
      const user = createUserDoc({
        name: 'Test User',
        email: 'test@gmail.com',
        password: 'secret',
        refreshToken: 'hashed-rt',
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({
          ...user,
          password: await Hashing.hash(user.password),
        } as User);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({
          ...user,
          refreshToken: null,
          password: 'hashed-new-secret',
        } as User);

      const spyMailUpdatePasswordSuccess = jest.spyOn(
        mailService,
        'updatePasswordSuccess',
      );

      const response = await service.updatePassword(
        user._id,
        user.password,
        'new-secret',
      );

      expect(response).toEqual({
        data: null,
        message: 'update password success',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({ _id: '1' });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        {
          password: 'new-secret',
          refreshToken: null,
        },
      );
      expect(spyMailUpdatePasswordSuccess).toBeCalledWith(
        user.email,
        user.name,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should throw error when user is not exist', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

      try {
        await service.deleteAccount('not-exist-id', {
          password: 'secret',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_FOUND,
          errors: {
            user: 'user is not exist',
          },
        });
      }
    });

    it('should throw error when password not match', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'secret',
      });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
        ...user,
        password: await Hashing.hash(user.password),
      } as User);

      try {
        await service.deleteAccount(user._id, {
          password: 'not-secret',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.FORBIDDEN,
          errors: {
            password: 'password does not match',
          },
        });
      }
    });

    it('should delete account and send email notification', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'secret',
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({
          ...user,
          password: await Hashing.hash(user.password),
        } as User);

      const spyUserServiceDelete = jest
        .spyOn(userService, 'delete')
        .mockResolvedValueOnce(user as User);

      const spyMailDeleteAccountSuccess = jest.spyOn(
        mailService,
        'deleteAccountSuccess',
      );

      const response = await service.deleteAccount(user._id, {
        password: user.password,
      });

      expect(response).toEqual({ data: null, message: 'account deleted' });
      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyUserServiceDelete).toBeCalledWith(user._id);
      expect(spyMailDeleteAccountSuccess).toBeCalledWith(user.email, user.name);
    });
  });

  describe('verifyEmail', () => {
    it('should throw error when user is not exist', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

      try {
        await service.verifyEmail('9');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_FOUND,
          errors: {
            user: 'user is not exist',
          },
        });
      }
    });

    it('should throw error when user not had email', async () => {
      const user = createUserDoc();
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.verifyEmail(user._id);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.CONFLICT,
          errors: {
            user: 'account not had email to verify',
          },
        });
      }
    });

    it('should throw error when user verified', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.verifyEmail(user._id);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.CONFLICT,
          errors: {
            user: 'user is already verify',
          },
        });
      }
    });

    it('should send verify email and response to client', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyKeyServiceCreate = jest
        .spyOn(keysService, 'create')
        .mockResolvedValueOnce({
          id: '2',
          key: 'verify-key',
          user: user,
        } as Key);

      const spyMailVerifyEmail = jest.spyOn(mailService, 'verifyEmail');

      const response = await service.verifyEmail(user._id);
      expect(response).toEqual({
        data: null,
        message: 'verify account email is sent',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyKeyServiceCreate).toBeCalledWith(user._id);
      expect(spyMailVerifyEmail).toBeCalledWith(
        user.email,
        'verify-key',
        user.name,
      );
    });
  });

  describe('confirmVerifyEmail', () => {
    it('should throw error when verifyKey expired or invalid', async () => {
      jest.spyOn(keysService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.confirmVerifyEmail('invalid-key');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            verifyKey: 'verifyKey is expired or invalid',
          },
        });
      }
    });

    it('should send email and response status', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });
      const spyKeysServiceVerify = jest
        .spyOn(keysService, 'verify')
        .mockResolvedValueOnce({
          _id: '1',
          key: 'valid-key',
          user: user,
        } as Key);
      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, isVerify: true } as User);
      const spyMailVerifyEmailSuccess = jest.spyOn(
        mailService,
        'verifyEmailSuccess',
      );

      const response = await service.confirmVerifyEmail('valid-key');
      expect(response).toEqual({ data: null, message: 'verify email success' });
      expect(spyKeysServiceVerify).toBeCalledWith('valid-key');
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { isVerify: true },
      );
      expect(spyMailVerifyEmailSuccess).toBeCalledWith(user.email, user.name);
    });
  });

  describe('signout', () => {
    it('should throw error when get not found user by accessToken', async () => {
      jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(undefined);

      try {
        await service.signout('9');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.FORBIDDEN,
          errors: {
            accessToken: 'invalid accessToken',
          },
        });
      }
    });

    it('should delete refreshToken in user field if accessToken valid', async () => {
      const user = createUserDoc();

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(createUserDoc({ refreshToken: null }) as User);

      const response = await service.signout(user._id);

      expect(response).toEqual({ data: null, message: 'signout success' });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id, refreshToken: { $exists: true, $ne: null } },
        { refreshToken: null },
      );
    });
  });

  describe('forgotPassword', () => {
    it('should throw error when email not exist', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);
      const invalidEmail = 'not-exist@gmail.com';

      try {
        await service.forgotPassword(invalidEmail);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_FOUND,
          errors: {
            email: `${invalidEmail} is not exist`,
          },
        });
      }
    });

    it('should throw error if user is not verified', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.forgotPassword(user.email);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            email: `${user.email} is not verified`,
          },
        });
      }
    });

    it('should throw error when email server down', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      jest
        .spyOn(mailService, 'forgotPassword')
        .mockRejectedValueOnce(new Error('email server down'));

      jest
        .spyOn(keysService, 'create')
        .mockResolvedValueOnce({ key: 'reset-key', user: user } as Key);

      try {
        await service.forgotPassword(user.email);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            email: 'reset password email is already sent, try again later',
          },
        });
      }
    });

    it('should throw error when duplicate request reset password', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      jest
        .spyOn(keysService, 'create')
        .mockRejectedValueOnce(new Error('duplicate'));

      try {
        await service.forgotPassword(user.email);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            email: 'reset password email is already sent, try again later',
          },
        });
      }
    });

    it('should send email reset password and response message', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyMailForgotPassword = jest.spyOn(mailService, 'forgotPassword');

      const spyForgotCreate = jest
        .spyOn(keysService, 'create')
        .mockResolvedValueOnce({ key: 'reset-key', user: user } as Key);

      const response = await service.forgotPassword(user.email);

      expect(response).toEqual({
        data: null,
        message: 'reset password email is sent',
      });
      expect(spyUserServiceFindOne).toBeCalledWith({ email: user.email });
      expect(spyMailForgotPassword).toBeCalledWith(
        user.email,
        'reset-key',
        user.name,
      );
      expect(spyForgotCreate).toBeCalledWith(user._id);
    });
  });

  describe('resetPassword', () => {
    it('should throw error when forgotPasswordKey is expired or invalid', async () => {
      jest.spyOn(keysService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.resetPassword('invalid-key', 'new-password');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            forgotPasswordKey: 'forgotPasswordKey is expired or invalid',
          },
        });
      }
    });

    it('should throw error when user info in forgotPasswordKey not exist', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      jest.spyOn(keysService, 'verify').mockResolvedValueOnce({
        key: 'valid-key',
        user,
      } as Key);

      jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(undefined);

      try {
        await service.resetPassword('valid-key', 'new-password');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          status: HttpStatus.NOT_ACCEPTABLE,
          errors: {
            forgotPasswordKey: 'forgotPasswordKey is expired or invalid',
          },
        });
      }
    });

    it('should clean refreshToken and update new password and send email notification', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      const spyForgotVerify = jest
        .spyOn(keysService, 'verify')
        .mockResolvedValueOnce({
          key: 'valid-key',
          user,
        } as Key);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({
          ...user,
          password: 'hashed-new-secret',
          refreshToken: null,
        } as User);

      const spyForgotRevoke = jest.spyOn(keysService, 'revoke');

      const spyMailResetPasswordSuccess = jest.spyOn(
        mailService,
        'resetPasswordSuccess',
      );

      const response = await service.resetPassword('valid-key', 'new-password');

      expect(response).toEqual({
        data: null,
        message: 'update new password success',
      });
      expect(spyForgotVerify).toBeCalledWith('valid-key');
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { password: 'new-password', refreshToken: null },
      );
      expect(spyForgotRevoke).toBeCalledWith('valid-key');
      expect(spyMailResetPasswordSuccess).toBeCalledWith(user.email, user.name);
    });
  });
});