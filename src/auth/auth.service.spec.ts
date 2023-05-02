import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Hashing } from '../common/helpers';
import { Key } from '../key/key.schema';
import { KeyService } from '../key/key.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthService } from './auth.service';
import { AccountType, ThirdPartyAccountInfo } from './auth.type';
import { omit } from '../../test/utils';

const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
    _id: '1',
    name: 'Test Name',
    ...override,
});

describe('AuthService', () => {
    let service: AuthService;
    let userService: DeepMocked<UserService>;
    let mailService: DeepMocked<MailService>;
    let keyService: DeepMocked<KeyService>;
    let authGoogleService: DeepMocked<AuthGoogleService>;
    let authFacebookService: DeepMocked<AuthFacebookService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: createMock<UserService>(),
                },
                {
                    provide: ConfigService,
                    useValue: createMock<ConfigService>(),
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest
                            .fn()
                            .mockImplementation()
                            .mockResolvedValue('token'),
                        decode: jest.fn().mockImplementation().mockReturnValue({
                            userId: '1',
                            iat: 123,
                            exp: 123,
                        }),
                    },
                },
                {
                    provide: KeyService,
                    useValue: createMock<KeyService>(),
                },
                {
                    provide: MailService,
                    useValue: createMock<MailService>(),
                },
                {
                    provide: AuthGoogleService,
                    useValue: createMock<AuthGoogleService>(),
                },
                {
                    provide: AuthFacebookService,
                    useValue: createMock<AuthFacebookService>(),
                },
            ],
        }).compile();

        service = module.get(AuthService);
        userService = module.get(UserService);
        mailService = module.get(MailService);
        keyService = module.get(KeyService);
        authGoogleService = module.get(AuthGoogleService);
        authFacebookService = module.get(AuthFacebookService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('should throw error when email already used', async () => {
            const user = createUserDoc({
                name: 'Test Name',
                email: 'test@gmail.com',
                password: 'secret',
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
                ...user,
                password: 'hashed-secret',
            } as User);

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

        it('should return serializated user info and accessToken when signup success', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                password: 'secret',
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

            jest.spyOn(userService, 'create').mockResolvedValueOnce({
                ...user,
                password: 'hashed-secret',
            } as User);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                password: 'hashed-secret',
                refreshToken: 'hashed-rt',
            } as User);

            jest.spyOn(mailService, 'signupSuccess');

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.signup(
                {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                },
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });
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
                expect(error.status).toEqual(HttpStatus.NOT_FOUND);
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

        it('should return serializated user info and access token when signin success', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                password: 'secret',
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
                ...user,
                password: await Hashing.hash(user.password),
            } as User);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: 'hashed-rt',
            } as User);

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.signin(
                {
                    email: user.email,
                    password: user.password,
                },
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });
        });
    });

    describe('refreshTokens', () => {
        it('should throw error when the request cookie does not have refreshToken', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                createUserDoc() as User,
            );

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

        it('should throw error when user or refreshToken does not exist', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                createUserDoc() as User,
            );

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

        it('should throw error if refreshToken is not valid', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                createUserDoc({
                    refreshToken: await Hashing.hash('rt'),
                }) as User,
            );

            const mockRequest = createMock<Request>({
                cookies: { refreshToken: 'invalid-refresh-token' as never },
            });
            const mockResponse = createMock<Response>({ cookie: jest.fn() });

            try {
                await service.refreshTokens(mockRequest, mockResponse);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
            }
        });

        it('should return the access token and response the new refreshToken if refreshToken valid', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                createUserDoc({
                    refreshToken: await Hashing.hash('rt'),
                }) as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                createUserDoc({ refreshToken: 'hashed-new-rt' }) as User,
            );

            const mockRequest = createMock<Request>({
                cookies: { refreshToken: 'rt' as never },
            });
            const mockResponse = createMock<Response>({ cookie: jest.fn() });

            const result = await service.refreshTokens(
                mockRequest,
                mockResponse,
            );

            expect(result).toEqual({
                accessToken: expect.any(String),
            });
            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
        });
    });

    describe('updatePassword', () => {
        it('should throw error when current password incorrect', async () => {
            const user = createUserDoc({
                name: 'Test User',
                email: 'test@gmail.com',
                password: 'secret',
                refreshToken: 'hashed-rt',
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
                ...user,
                password: await Hashing.hash(user.password),
            } as User);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: null,
                password: 'hashed-new-secret',
            } as User);

            jest.spyOn(mailService, 'updatePasswordSuccess');

            try {
                await service.updatePassword(
                    user._id,
                    'incorrect-password',
                    'new-secret',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
            }
        });
    });

    describe('verifyEmail', () => {
        it('should throw error when user not had email', async () => {
            const user = createUserDoc();
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            try {
                await service.verifyEmail(user._id);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.CONFLICT);
            }
        });

        it('should throw error when user verified', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: true,
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            try {
                await service.verifyEmail(user._id);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.CONFLICT);
            }
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
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: false,
            });
            jest.spyOn(keyService, 'verify').mockResolvedValueOnce({
                _id: '1',
                key: 'valid-key',
                email: user.email,
            } as Key);
            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                isVerify: true,
            } as User);
            jest.spyOn(mailService, 'verifyEmailSuccess');

            await service.confirmVerifyEmail('valid-key');
        });
    });

    describe('signout', () => {
        it('should throw error when get not found user by accessToken', async () => {
            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                undefined,
            );
            const mockResponse = createMock<Response>({
                clearCookie: jest.fn(),
            });

            try {
                await service.signout('9', mockResponse);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.UNAUTHORIZED);
            }
        });

        it('should delete refreshToken in user field if accessToken valid', async () => {
            const user = createUserDoc();
            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                createUserDoc({ refreshToken: null }) as User,
            );
            const mockResponse = createMock<Response>({
                clearCookie: jest.fn(),
            });

            await service.signout(user._id, mockResponse);
        });

        it('should clear response clear cookie', async () => {
            const user = createUserDoc();
            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                createUserDoc({ refreshToken: null }) as User,
            );
            const mockResponse = createMock<Response>({
                clearCookie: jest.fn(),
            });

            await service.signout(user._id, mockResponse);

            expect(mockResponse.clearCookie).toBeCalledWith('refreshToken');
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
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: false,
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            try {
                await service.forgotPassword(user.email);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
            }
        });

        it('should throw error when duplicate request reset password', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: true,
            });
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(keyService, 'create').mockRejectedValueOnce(
                new Error('duplicate'),
            );

            try {
                await service.forgotPassword(user.email);
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
            }
        });

        it('should send email reset password and response message', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: true,
            });
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(mailService, 'forgotPassword');

            jest.spyOn(keyService, 'create').mockResolvedValueOnce({
                key: 'reset-key',
                email: user.email,
            } as Key);

            await service.forgotPassword(user.email);
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
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: true,
            });
            jest.spyOn(keyService, 'verify').mockResolvedValueOnce({
                key: 'valid-key',
                email: user.email,
            } as Key);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                undefined,
            );

            try {
                await service.resetPassword('valid-key', 'new-password');
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
            }
        });

        it('should clean refreshToken and update new password and send email notification', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                isVerify: true,
            });
            jest.spyOn(keyService, 'verify').mockResolvedValueOnce({
                key: 'valid-key',
                email: user.email,
            } as Key);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                password: 'hashed-new-secret',
                refreshToken: null,
            } as User);

            jest.spyOn(keyService, 'revoke');

            jest.spyOn(mailService, 'resetPasswordSuccess');

            await service.resetPassword('valid-key', 'new-password');
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
            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce(
                undefined,
            );

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            try {
                await service.googleSignIn(
                    'invalid-google-access-token',
                    mockResponse,
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should create new account and return tokens if not exist', async () => {
            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.google,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

            jest.spyOn(userService, 'create').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: 'hashed-rt',
            } as User);

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.googleSignIn(
                'valid-google-access-token',
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });
            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
        });

        it('should return new tokens if exist google account', async () => {
            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.google,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: 'hashed-rt',
            } as User);

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.googleSignIn(
                'valid-google-access-token',
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });
            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
        });
    });

    describe('connectGoogle', () => {
        const user = createUserDoc({
            google: { id: 'google-id', email: 'test@gmail.com' },
        });

        it('should throw error when account already connected with google account', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            try {
                await service.connectGoogle(
                    user._id,
                    'valid-google-access-token',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.CONFLICT);
            }
        });

        it('should throw error when google access token invalid', async () => {
            const user = createUserDoc({
                google: { id: 'google-id', email: 'test@gmail.com' },
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
                ...user,
                google: null,
            } as User);

            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce(
                undefined,
            );

            try {
                await service.connectGoogle(
                    user._id,
                    'invalid-google-access-token',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should throw error when this google account is used for another account', async () => {
            jest.spyOn(userService, 'findOne')
                .mockResolvedValueOnce({ ...user, google: null } as User)
                .mockResolvedValueOnce({ ...user, _id: '2' } as User);

            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.google,
            } as ThirdPartyAccountInfo);

            try {
                await service.connectGoogle(
                    user._id,
                    'valid-google-access-token',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should connect to email account', async () => {
            jest.spyOn(userService, 'findOne')
                .mockResolvedValueOnce({ ...user, google: null } as User)
                .mockResolvedValueOnce(undefined);

            jest.spyOn(authGoogleService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.google,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                user as User,
            );

            await service.connectGoogle(user._id, 'valid-google-access-token');
        });
    });

    describe('facebookSignIn', () => {
        const user = createUserDoc({
            facebook: { id: 'facebook-id', email: 'test@gmail.com' },
        });

        it('should throw error when facebook access token invalid', async () => {
            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce(
                undefined,
            );

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            try {
                await service.facebookSignIn(
                    'invalid-facebook-access-token',
                    mockResponse,
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should create new account and return tokens if not exist', async () => {
            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.facebook,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);

            jest.spyOn(userService, 'create').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: 'hashed-rt',
            } as User);

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.facebookSignIn(
                'valid-facebook-access-token',
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });

            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
        });

        it('should return new tokens if exist facebook account', async () => {
            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.facebook,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                refreshToken: 'hashed-rt',
            } as User);

            const mockResponse = createMock<Response>({
                cookie: jest.fn(),
            });

            const result = await service.facebookSignIn(
                'valid-facebook-access-token',
                mockResponse,
            );

            expect(result).toEqual({
                user: omit(user, ['password']),
                accessToken: expect.any(String),
            });
            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
        });
    });

    describe('connectFacebook', () => {
        const user = createUserDoc({
            facebook: { id: 'facebook-id', email: 'test@gmail.com' },
        });

        it('should throw error when account already connected with facebook account', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            try {
                await service.connectFacebook(
                    user._id,
                    'valid-facebook-access-token',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.CONFLICT);
            }
        });

        it('should throw error when facebook access token invalid', async () => {
            const user = createUserDoc({
                facebook: { id: 'facebook-id', email: 'test@gmail.com' },
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce({
                ...user,
                facebook: null,
            } as User);

            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce(
                undefined,
            );

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
            jest.spyOn(userService, 'findOne')
                .mockResolvedValueOnce({ ...user, facebook: null } as User)
                .mockResolvedValueOnce({ ...user, _id: '2' } as User);

            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.facebook,
            } as ThirdPartyAccountInfo);

            try {
                await service.connectFacebook(
                    user._id,
                    'valid-facebook-access-token',
                );
            } catch (error) {
                expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should connect to email account', async () => {
            jest.spyOn(userService, 'findOne')
                .mockResolvedValueOnce({ ...user, facebook: null } as User)
                .mockResolvedValueOnce(undefined);

            jest.spyOn(authFacebookService, 'verify').mockResolvedValueOnce({
                name: user.name,
                ...user.facebook,
            } as ThirdPartyAccountInfo);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce(
                user as User,
            );

            await service.connectFacebook(
                user._id,
                'valid-facebook-access-token',
            );
        });
    });

    describe('connectEmail', () => {
        const user = createUserDoc({
            email: 'test@gmail.com',
            password: 'secret',
        });

        it('should throw error when account already connected with email', async () => {
            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

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
            jest.spyOn(userService, 'findOne')
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
            jest.spyOn(userService, 'findOne')
                .mockResolvedValueOnce({ ...user, email: null } as User)
                .mockResolvedValueOnce(undefined);

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                password: 'hashed-secret',
            } as User);

            await service.connectEmail(user._id, {
                email: user.email,
                password: user.password,
            });
        });
    });

    describe('unlinkAccount', () => {
        it('should throw error when account had only one signin method', async () => {
            const user = createUserDoc({ email: 'test@gmail.com' });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

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

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                google: null,
            } as User);

            await service.unlinkAccount(user._id, AccountType.Google);
        });

        it('should unlink facebook account', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                password: 'hashed-secret',
                facebook: { id: 'facebook-id', email: 'test@gmail.com' },
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                facebook: null,
            } as User);

            await service.unlinkAccount(user._id, AccountType.Facebook);
        });

        it('should unlink email', async () => {
            const user = createUserDoc({
                email: 'test@gmail.com',
                password: 'hashed-secret',
                isVerify: true,
                facebook: { id: 'facebook-id', email: 'test@gmail.com' },
            });

            jest.spyOn(userService, 'findOne').mockResolvedValueOnce(
                user as User,
            );

            jest.spyOn(userService, 'findOneAndUpdate').mockResolvedValueOnce({
                ...user,
                email: null,
                password: null,
                isVerify: false,
            } as User);

            await service.unlinkAccount(user._id, AccountType.Email);
        });
    });
});
