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
});
