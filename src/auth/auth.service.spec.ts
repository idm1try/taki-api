import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { createMock } from '@golevelup/ts-jest';
import { createMockFromClass } from '../../test/utils/createMockFromClass';
import { Hashing } from '../common/helpers';
import { Key } from '../key/key.schema';
import { KeyService } from '../key/key.service';
import { MailService } from '../mail/mail.service';
import { UserProfileSerialization } from '../user/serialization/user-profile.serialization';
import { User } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthService } from './auth.service';
import { AccountType, ThirdPartyAccountInfo } from './auth.type';

const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userService: UserService;
  let mailService: MailService;
  let keyService: KeyService;
  let authGoogleService: AuthGoogleService;
  let authFacebookService: AuthFacebookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: createMockFromClass(UserService),
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
          provide: KeyService,
          useValue: createMockFromClass(KeyService),
        },
        {
          provide: MailService,
          useValue: createMockFromClass(MailService),
        },
        {
          provide: AuthGoogleService,
          useValue: createMockFromClass(AuthGoogleService),
        },
        {
          provide: AuthFacebookService,
          useValue: createMockFromClass(AuthFacebookService),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);
    keyService = module.get<KeyService>(KeyService);
    authGoogleService = module.get<AuthGoogleService>(AuthGoogleService);
    authFacebookService = module.get<AuthFacebookService>(AuthFacebookService);
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

      const mockResponse = createMock<Response>({
        cookie: jest.fn(),
      });

      try {
        await service.signup(
          {
            name: user.name,
            email: user.email,
            password: user.password,
          },
          mockResponse,
        );
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
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

      const spyUserServiceGetUserInfo = jest
        .spyOn(userService, 'getUserInfo')
        .mockResolvedValueOnce(user as any);

      const mockResponse = createMock<Response>({
        cookie: jest.fn(),
      });

      const response = await service.signup(
        {
          name: user.name,
          email: user.email,
          password: user.password,
        },
        mockResponse,
      );

      expect(response).toEqual({
        tokens: { accessToken: 'at', refreshToken: 'rt' },
        user,
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
      expect(spyUserServiceGetUserInfo).toBeCalledWith(user._id);
      expect(mockResponse.cookie).toBeCalledTimes(1);
    });
  });

  describe('signin', () => {
    it('should throw error when email is not exist', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

      const mockResponse = createMock<Response>({
        cookie: jest.fn(),
      });

      try {
        await service.signin(
          {
            email: 'notexist@gmail.com',
            password: 'wrong',
          },
          mockResponse,
        );
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
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

      const mockResponse = createMock<Response>({
        cookie: jest.fn(),
      });

      try {
        await service.signin(
          {
            email: user.email,
            password: 'not-secret',
          },
          mockResponse,
        );
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
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

      const spyUserServiceGetUserInfo = jest
        .spyOn(userService, 'getUserInfo')
        .mockResolvedValueOnce(user as any);

      const mockResponse = createMock<Response>({
        cookie: jest.fn(),
      });

      const response = await service.signin(
        {
          email: user.email,
          password: user.password,
        },
        mockResponse,
      );

      expect(response).toEqual({
        tokens: {
          accessToken: 'at',
          refreshToken: 'rt',
        },
        user,
      });
      expect(spyUserServiceFindOne).toBeCalledWith({
        email: user.email,
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: '1' },
        { refreshToken: 'rt' },
      );
      expect(spyUserServiceGetUserInfo).toBeCalledWith(user._id);
      expect(mockResponse.cookie).toBeCalledTimes(1);
    });
  });

  describe('refreshTokens', () => {
    it('should throw error when request cookie not has refreshToken', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(createUserDoc() as User);

      const mockRequest = createMock<Request>({
        cookies: {},
      });
      const mockResponse = createMock<Response>({ cookie: jest.fn() });

      try {
        await service.refreshTokens(mockRequest, mockResponse);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should throw error when user or refreshToken does exist', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(createUserDoc() as User);
      jest.spyOn(jwtService, 'decode').mockReturnValueOnce({
        userId: '1',
        iat: 123,
        exp: 123,
      });

      const mockRequest = createMock<Request>({
        cookies: { refreshToken: 'rt' as never },
      });
      const mockResponse = createMock<Response>({ cookie: jest.fn() });

      try {
        await service.refreshTokens(mockRequest, mockResponse);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should throw error if refreshToken not match', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
        createUserDoc({
          refreshToken: await Hashing.hash('rt'),
        }) as User,
      );

      const mockRequest = createMock<Request>({
        cookies: { refreshToken: 'invalid-refresh-token' as never },
      });
      const mockResponse = createMock<Response>({ cookie: jest.fn() });
      jest
        .spyOn(jwtService, 'decode')
        .mockReturnValueOnce({ userId: '1', iat: 123, exp: 123 });

      try {
        await service.refreshTokens(mockRequest, mockResponse);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
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

      const spyJwtDecode = jest
        .spyOn(jwtService, 'decode')
        .mockReturnValueOnce({ userId: '1', iat: 123, exp: 123 });
      const spyUserServiceGetUserInfo = jest
        .spyOn(userService, 'getUserInfo')
        .mockResolvedValueOnce(user as any);

      const mockRequest = createMock<Request>({
        cookies: { refreshToken: 'rt' as never },
      });
      const mockResponse = createMock<Response>({ cookie: jest.fn() });

      const response = await service.refreshTokens(mockRequest, mockResponse);

      expect(response).toEqual({
        tokens: {
          accessToken: 'new-at',
          refreshToken: 'new-rt',
        },
        user,
      });
      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyJwtDecode).toBeCalledWith('rt');
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
      expect(spyUserServiceGetUserInfo).toBeCalledWith(user._id);
    });
  });

  describe('accountInfo', () => {
    it('should throw error when userId not found', async () => {
      jest.spyOn(userService, 'getUserInfo').mockReturnValueOnce(undefined);

      try {
        await service.accountInfo('not-exist-id');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.FORBIDDEN);
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
        _id: user._id,
        name: user.name,
        email: user.email,
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

      await service.updatePassword(user._id, user.password, 'new-secret');

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
        expect(error.status).toEqual(HttpStatus.NOT_FOUND);
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
        expect(error.status).toEqual(HttpStatus.FORBIDDEN);
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

      await service.deleteAccount(user._id, {
        password: user.password,
      });

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
        expect(error.status).toEqual(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw error when user not had email', async () => {
      const user = createUserDoc();
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.verifyEmail(user._id);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should throw error when user verified', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.verifyEmail(user._id);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should send verify email and response to client', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyKeyServiceCreate = jest
        .spyOn(keyService, 'create')
        .mockResolvedValueOnce({
          id: '2',
          key: 'verify-key',
          user: user,
        } as Key);

      const spyMailVerifyEmail = jest.spyOn(mailService, 'verifyEmail');

      await service.verifyEmail(user._id);

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
      jest.spyOn(keyService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.confirmVerifyEmail('invalid-key');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should send email and response status', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });
      const spyKeyServiceVerify = jest
        .spyOn(keyService, 'verify')
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

      await service.confirmVerifyEmail('valid-key');
      expect(spyKeyServiceVerify).toBeCalledWith('valid-key');
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
        expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should delete refreshToken in user field if accessToken valid', async () => {
      const user = createUserDoc();

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(createUserDoc({ refreshToken: null }) as User);

      await service.signout(user._id);

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
        expect(error.status).toEqual(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw error if user is not verified', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: false });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.forgotPassword(user.email);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should throw error when duplicate request reset password', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      jest
        .spyOn(keyService, 'create')
        .mockRejectedValueOnce(new Error('duplicate'));

      try {
        await service.forgotPassword(user.email);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should send email reset password and response message', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyMailForgotPassword = jest.spyOn(mailService, 'forgotPassword');

      const spyForgotCreate = jest
        .spyOn(keyService, 'create')
        .mockResolvedValueOnce({ key: 'reset-key', user: user } as Key);

      await service.forgotPassword(user.email);

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
      jest.spyOn(keyService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.resetPassword('invalid-key', 'new-password');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should throw error when user info in forgotPasswordKey not exist', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      jest.spyOn(keyService, 'verify').mockResolvedValueOnce({
        key: 'valid-key',
        user,
      } as Key);

      jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(undefined);

      try {
        await service.resetPassword('valid-key', 'new-password');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should clean refreshToken and update new password and send email notification', async () => {
      const user = createUserDoc({ email: 'test@gmail.com', isVerify: true });
      const spyForgotVerify = jest
        .spyOn(keyService, 'verify')
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

      const spyForgotRevoke = jest.spyOn(keyService, 'revoke');

      const spyMailResetPasswordSuccess = jest.spyOn(
        mailService,
        'resetPasswordSuccess',
      );

      await service.resetPassword('valid-key', 'new-password');

      expect(spyForgotVerify).toBeCalledWith('valid-key');
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { password: 'new-password', refreshToken: null },
      );
      expect(spyForgotRevoke).toBeCalledWith('valid-key');
      expect(spyMailResetPasswordSuccess).toBeCalledWith(user.email, user.name);
    });
  });

  describe('updateAccountInfo', () => {
    it('should throw error when update object is empty', async () => {
      try {
        await service.updateAccountInfo('1', {});
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should throw error when new email same as old email', async () => {
      const user = createUserDoc({ email: 'test@gmail.com' });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.updateAccountInfo(user._id, { email: user.email });
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should throw error when new email is being used by another account', async () => {
      const user = createUserDoc({ _id: '2', email: 'test@gmail.com' });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.updateAccountInfo('1', { email: user.email });
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should response message update success', async () => {
      const user = createUserDoc({ email: 'test@gmail.com' });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(undefined);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(user as User);

      await service.updateAccountInfo(user._id, {
        name: 'New Test Name',
        email: 'newtest@gmail.com',
      });

      expect(spyUserServiceFindOne).toBeCalledWith({
        email: 'newtest@gmail.com',
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { name: 'New Test Name', email: 'newtest@gmail.com' },
      );
    });
  });

  describe('googleSignIn', () => {
    const user = createUserDoc({
      name: 'Test Name',
      google: {
        id: 'google-id',
        email: 'test@gmail.com',
      },
    });

    it('should throw error when google access token invalid', async () => {
      jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.googleSignIn('invalid-google-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should create new account and return tokens if not exist', async () => {
      const spyAuthGoogleServiceVerify = jest
        .spyOn(authGoogleService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.google,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(undefined);

      const spyUserServiceCreate = jest
        .spyOn(userService, 'create')
        .mockResolvedValueOnce(user as User);

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, refreshToken: 'hashed-rt' } as User);

      const spyMailSignupSuccess = jest.spyOn(mailService, 'signupSuccess');

      const response = await service.googleSignIn('valid-google-access-token');

      expect(response).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      expect(spyAuthGoogleServiceVerify).toBeCalledWith(
        'valid-google-access-token',
      );
      expect(spyUserServiceFindOne).toBeCalledWith({
        'google.id': user.google.id,
      });
      expect(spyUserServiceCreate).toBeCalledWith({
        google: { id: user.google.id, email: user.google.email },
        name: user.name,
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
        { refreshToken: 'rt' },
      );
      expect(spyMailSignupSuccess).toBeCalledWith(user.google.email, user.name);
    });

    it('should return new tokens if exist google account', async () => {
      const spyAuthGoogleServiceVerify = jest
        .spyOn(authGoogleService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.google,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, refreshToken: 'hashed-rt' } as User);

      const tokens = await service.googleSignIn('valid-google-access-token');

      expect(tokens).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      expect(spyAuthGoogleServiceVerify).toBeCalledWith(
        'valid-google-access-token',
      );
      expect(spyUserServiceFindOne).toBeCalledWith({
        'google.id': user.google.id,
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
        { refreshToken: 'rt' },
      );
    });
  });

  describe('connectGoogle', () => {
    const user = createUserDoc({
      google: { id: 'google-id', email: 'test@gmail.com' },
    });

    it('should throw error when account already connected with google account', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.connectGoogle(user._id, 'valid-google-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should throw error when google access token invalid', async () => {
      const user = createUserDoc({
        google: { id: 'google-id', email: 'test@gmail.com' },
      });

      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, google: null } as User);

      jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce(undefined);

      try {
        await service.connectGoogle(user._id, 'invalid-google-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw error when this google account is used for another account', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, google: null } as User)
        .mockResolvedValueOnce({ ...user, _id: '2' } as User);

      jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce({
        name: user.name,
        ...user.google,
      } as ThirdPartyAccountInfo);

      try {
        await service.connectGoogle(user._id, 'valid-google-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should connect to email account', async () => {
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, google: null } as User)
        .mockResolvedValueOnce(undefined);

      const spyAuthGoogleServiceVerify = jest
        .spyOn(authGoogleService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.google,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(user as User);

      await service.connectGoogle(user._id, 'valid-google-access-token');

      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(1, {
        _id: user._id,
      });
      expect(spyAuthGoogleServiceVerify).toBeCalledWith(
        'valid-google-access-token',
      );
      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(2, {
        'google.id': user.google.id,
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { google: user.google },
      );
    });
  });

  describe('facebookSignIn', () => {
    const user = createUserDoc({
      facebook: { id: 'facebook-id', email: 'test@gmail.com' },
    });

    it('should throw error when facebook access token invalid', async () => {
      jest
        .spyOn(authFacebookService, 'verify')
        .mockResolvedValueOnce(undefined);

      try {
        await service.facebookSignIn('invalid-facebook-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should create new account and return tokens if not exist', async () => {
      const spyAuthFacebookServiceVerify = jest
        .spyOn(authFacebookService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.facebook,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(undefined);

      const spyUserServiceCreate = jest
        .spyOn(userService, 'create')
        .mockResolvedValueOnce(user as User);

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, refreshToken: 'hashed-rt' } as User);

      const spyMailSignupSuccess = jest.spyOn(mailService, 'signupSuccess');

      const response = await service.facebookSignIn(
        'valid-facebook-access-token',
      );

      expect(response).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      expect(spyAuthFacebookServiceVerify).toBeCalledWith(
        'valid-facebook-access-token',
      );
      expect(spyUserServiceFindOne).toBeCalledWith({
        'facebook.id': user.facebook.id,
      });
      expect(spyUserServiceCreate).toBeCalledWith({
        name: user.name,
        facebook: user.facebook,
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
        { refreshToken: 'rt' },
      );
      expect(spyMailSignupSuccess).toBeCalledWith(
        user.facebook.email,
        user.name,
      );
    });

    it('should return new tokens if exist facebook account', async () => {
      const spyAuthFacebookServiceVerify = jest
        .spyOn(authFacebookService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.facebook,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyJwtSign = jest
        .spyOn(jwtService, 'sign')
        .mockResolvedValueOnce('at' as never)
        .mockResolvedValueOnce('rt' as never);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, refreshToken: 'hashed-rt' } as User);

      const response = await service.facebookSignIn(
        'valid-facebook-access-token',
      );
      expect(response).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      expect(spyAuthFacebookServiceVerify).toBeCalledWith(
        'valid-facebook-access-token',
      );
      expect(spyUserServiceFindOne).toBeCalledWith({
        'facebook.id': user.facebook.id,
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
        { refreshToken: 'rt' },
      );
    });
  });

  describe('connectFacebook', () => {
    const user = createUserDoc({
      facebook: { id: 'facebook-id', email: 'test@gmail.com' },
    });

    it('should throw error when account already connected with facebook account', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.connectFacebook(user._id, 'valid-facebook-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should throw error when facebook access token invalid', async () => {
      const user = createUserDoc({
        facebook: { id: 'facebook-id', email: 'test@gmail.com' },
      });

      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, facebook: null } as User);

      jest
        .spyOn(authFacebookService, 'verify')
        .mockResolvedValueOnce(undefined);

      try {
        await service.connectFacebook(
          user._id,
          'invalid-facebook-access-token',
        );
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw error when this facebook account is used for another account', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, facebook: null } as User)
        .mockResolvedValueOnce({ ...user, _id: '2' } as User);

      jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce({
        name: user.name,
        ...user.facebook,
      } as ThirdPartyAccountInfo);

      try {
        await service.connectFacebook(user._id, 'valid-facebook-access-token');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should connect to email account', async () => {
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, facebook: null } as User)
        .mockResolvedValueOnce(undefined);

      const spyAuthFacebookServiceVerify = jest
        .spyOn(authFacebookService, 'verify')
        .mockResolvedValueOnce({
          name: user.name,
          ...user.facebook,
        } as ThirdPartyAccountInfo);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce(user as User);

      await service.connectFacebook(user._id, 'valid-facebook-access-token');

      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(1, { _id: '1' });
      expect(spyAuthFacebookServiceVerify).toBeCalledWith(
        'valid-facebook-access-token',
      );
      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(2, {
        'facebook.id': user.facebook.id,
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { facebook: user.facebook },
      );
    });
  });

  describe('connectEmail', () => {
    const user = createUserDoc({ email: 'test@gmail.com', password: 'secret' });

    it('should throw error when account already connected with email', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.connectEmail(user._id, {
          email: user.email,
          password: user.password,
        });
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.CONFLICT);
      }
    });

    it('should throw error when this email is used for another account', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, email: null } as User)
        .mockResolvedValueOnce({ ...user, _id: '2' } as User);

      try {
        await service.connectEmail(user._id, {
          email: user.email,
          password: user.password,
        });
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should connect to facebook/google account', async () => {
      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce({ ...user, email: null } as User)
        .mockResolvedValueOnce(undefined);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, password: 'hashed-secret' } as User);

      await service.connectEmail(user._id, {
        email: user.email,
        password: user.password,
      });

      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(1, {
        _id: user._id,
      });
      expect(spyUserServiceFindOne).toHaveBeenNthCalledWith(2, {
        email: user.email,
      });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { email: user.email, password: user.password },
      );
    });
  });

  describe('unlinkAccount', () => {
    it('should throw error when accessToken not valid', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(null as User);

      try {
        await service.unlinkAccount('1', AccountType.Email);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.FORBIDDEN);
      }
    });

    it('should throw error when account had only one signin method', async () => {
      const user = createUserDoc({ email: 'test@gmail.com' });

      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(user as User);

      try {
        await service.unlinkAccount(user._id, AccountType.Email);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should unlink google account', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'hashed-secret',
        google: { id: 'google-id', email: 'test@gmail.com' },
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, google: null } as User);

      await service.unlinkAccount(user._id, AccountType.Google);

      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { $unset: { google: '' } },
      );
    });

    it('should unlink facebook account', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'hashed-secret',
        facebook: { id: 'facebook-id', email: 'test@gmail.com' },
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...user, facebook: null } as User);

      await service.unlinkAccount(user._id, AccountType.Facebook);

      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { $unset: { facebook: '' } },
      );
    });

    it('should unlink email', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'hashed-secret',
        isVerify: true,
        facebook: { id: 'facebook-id', email: 'test@gmail.com' },
      });

      const spyUserServiceFindOne = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(user as User);

      const spyUserServiceFindOneAndUpdate = jest
        .spyOn(userService, 'findOneAndUpdate')
        .mockResolvedValueOnce({
          ...user,
          email: null,
          password: null,
          isVerify: false,
        } as User);

      await service.unlinkAccount(user._id, AccountType.Email);

      expect(spyUserServiceFindOne).toBeCalledWith({ _id: user._id });
      expect(spyUserServiceFindOneAndUpdate).toBeCalledWith(
        { _id: user._id },
        { $unset: { email: '', password: '', isVerify: '' } },
      );
    });
  });
});
