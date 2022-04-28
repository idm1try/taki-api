import { ConfigService } from '@nestjs/config';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Payload, Tokens } from './auth.interfaces';
import { APIResponse, IAPIResponse } from '../helpers/response.helper';
import { SignupDto } from './dtos/signup.dto';
import { MailService } from '../mail/mail.service';
import { SigninEmailDto } from './dtos/signin-email.dto';
import { Hashing } from '../utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  public async generateTokens(payload: Payload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwt.accessSecret'),
        expiresIn: 60 * 15,
      }),
      this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwt.refreshSecret'),
        expiresIn: 60 * 60 * 24 * 7,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  public async signup(signupDto: SignupDto): IAPIResponse<Tokens> {
    const foundUsers = await this.usersService.findOne({
      email: signupDto.email,
    });

    if (foundUsers) {
      throw APIResponse.Error(HttpStatus.CONFLICT, {
        email: 'email is already used',
      });
    }

    const user = await this.usersService.create(signupDto);

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.usersService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    await this.mailService.signupSuccess(user.email, user.name);
    return APIResponse.Success(tokens, 'signup success');
  }

  public async signin(signinEmailDto: SigninEmailDto): IAPIResponse<Tokens> {
    const user = await this.usersService.findOne({
      email: signinEmailDto.email,
    });

    if (!user) {
      throw APIResponse.Error(HttpStatus.BAD_REQUEST, {
        email: 'email is not exist',
      });
    }

    const isMatchedPassword = await Hashing.verify(
      user.password,
      signinEmailDto.password,
    );

    if (!isMatchedPassword) {
      throw APIResponse.Error(HttpStatus.BAD_REQUEST, {
        password: 'incorect password',
      });
    }

    const tokens = await this.generateTokens({
      userId: user?._id,
    });

    await this.usersService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return APIResponse.Success(tokens, 'signin success');
  }

  public async refreshTokens(
    userId: string,
    refreshToken: string,
  ): IAPIResponse<Tokens> {
    const user = await this.usersService.findOne({ _id: userId });
    if (!user || !user.refreshToken) {
      throw APIResponse.Error(HttpStatus.UNAUTHORIZED, {
        accessToken: 'access denied',
      });
    }

    const isRefreshTokenMatch = await Hashing.verify(
      user.refreshToken,
      refreshToken,
    );

    if (!isRefreshTokenMatch) {
      throw APIResponse.Error(HttpStatus.UNAUTHORIZED, {
        accessToken: 'invalid refreshToken',
      });
    }

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.usersService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return APIResponse.Success(tokens, 'refresh new tokens success');
  }
}
