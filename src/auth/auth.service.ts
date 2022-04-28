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
import { UserProfileSerialization } from '../users/serializations/user-profile.serialization';
import { DeleteAccountDto } from './dtos/delete-account.dto';
import { KeysService } from '../keys/keys.service';
import { UpdateAccountDto } from './dtos/update-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly keysService: KeysService,
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

  public async accountInfo(
    userId: string,
  ): Promise<IAPIResponse<UserProfileSerialization>> {
    const user = await this.usersService.getUserInfo(userId);

    if (!user) {
      throw APIResponse.Error(HttpStatus.FORBIDDEN, {
        accessToken: 'invalid accessToken',
      });
    }
    return APIResponse.Success(user, 'get account info success');
  }

  public async updatePassword(
    userId: string,
    password: string,
    newPassword: string,
  ): IAPIResponse<null> {
    const user = await this.usersService.findOne({ _id: userId });
    const isMatchedPassword = await Hashing.verify(user.password, password);

    if (!isMatchedPassword) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        currentPassword: 'current password is not match',
      });
    }

    await this.usersService.findOneAndUpdate(
      { _id: userId },
      {
        password: newPassword,
        refreshToken: null,
      },
    );

    await this.mailService.updatePasswordSuccess(user.email, user.name);
    return APIResponse.Success(null, 'update password success');
  }

  public async deleteAccount(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
  ) {
    const user = await this.usersService.findOne({ _id: userId });
    if (!user) {
      throw APIResponse.Error(HttpStatus.NOT_FOUND, {
        user: 'user is not exist',
      });
    }

    const isMatchedPassword = await Hashing.verify(
      user.password,
      deleteAccountDto.password,
    );
    if (!isMatchedPassword) {
      throw APIResponse.Error(HttpStatus.FORBIDDEN, {
        password: 'password does not match',
      });
    }

    const deletedAccount = await this.usersService.delete(userId);
    await this.mailService.deleteAccountSuccess(
      deletedAccount.email,
      deletedAccount.name,
    );
    return APIResponse.Success(null, 'account deleted');
  }

  public async verifyEmail(userId: string): IAPIResponse<null> {
    const user = await this.usersService.findOne({ _id: userId });
    if (!user) {
      throw APIResponse.Error(HttpStatus.NOT_FOUND, {
        user: 'user is not exist',
      });
    }
    if (!user.email) {
      throw APIResponse.Error(HttpStatus.CONFLICT, {
        user: 'account not had email to verify',
      });
    }

    if (user.isVerify) {
      throw APIResponse.Error(HttpStatus.CONFLICT, {
        user: 'user is already verify',
      });
    }

    const verifyKey = await this.keysService.create(user._id);
    await this.mailService.verifyEmail(user.email, verifyKey.key, user.name);
    return APIResponse.Success(null, 'verify account email is sent');
  }

  public async confirmVerifyEmail(key: string) {
    const verifyKey = await this.keysService.verify(key);
    if (!verifyKey) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        verifyKey: 'verifyKey is expired or invalid',
      });
    }

    const user = await this.usersService.findOneAndUpdate(
      { _id: verifyKey.user._id },
      { isVerify: true },
    );

    if (!user) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        verifyKey: 'verifyKey is expired or invalid',
      });
    }
    await this.keysService.revoke(key);
    await this.mailService.verifyEmailSuccess(user.email, user.name);
    return APIResponse.Success(null, 'verify email success');
  }

  public async signout(userId: string): Promise<IAPIResponse<null>> {
    const user = await this.usersService.findOneAndUpdate(
      { _id: userId, refreshToken: { $exists: true, $ne: null } },
      { refreshToken: null },
    );

    if (!user) {
      throw APIResponse.Error(HttpStatus.FORBIDDEN, {
        accessToken: 'invalid accessToken',
      });
    }

    return APIResponse.Success(null, 'signout success');
  }

  public async forgotPassword(email: string): IAPIResponse<null> {
    const user = await this.usersService.findOne({ email });

    if (!user) {
      throw APIResponse.Error(HttpStatus.NOT_FOUND, {
        email: `${email} is not exist`,
      });
    }

    if (!user.isVerify) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        email: `${email} is not verified`,
      });
    }

    try {
      const forgotPassword = await this.keysService.create(user._id);

      await this.mailService.forgotPassword(
        user.email,
        forgotPassword.key,
        user.name,
      );

      return APIResponse.Success(null, 'reset password email is sent');
    } catch (error) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        email: 'reset password email is already sent, try again later',
      });
    }
  }

  public async resetPassword(
    forgotPasswordKey: string,
    newPassword: string,
  ): IAPIResponse<null> {
    const forgotPassword = await this.keysService.verify(forgotPasswordKey);
    if (!forgotPassword) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        forgotPasswordKey: 'forgotPasswordKey is expired or invalid',
      });
    }

    const user = await this.usersService.findOneAndUpdate(
      { _id: forgotPassword.user._id },
      { password: newPassword, refreshToken: null },
    );

    if (!user) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        forgotPasswordKey: 'forgotPasswordKey is expired or invalid',
      });
    }

    await this.keysService.revoke(forgotPasswordKey);
    await this.mailService.resetPasswordSuccess(user.email, user.name);
    return APIResponse.Success(null, 'update new password success');
  }

  public async updateAccountInfo(
    userId: string,
    updateAccountInfoDto: UpdateAccountDto,
  ): IAPIResponse<null> {
    if (!Object.keys(updateAccountInfoDto)) {
      throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
        account: 'nothing new to update',
      });
    }
    if (updateAccountInfoDto.email) {
      const user = await this.usersService.findOne({
        email: updateAccountInfoDto.email,
      });

      if (user && user._id.toString() === userId) {
        throw APIResponse.Error(HttpStatus.NOT_ACCEPTABLE, {
          email: `${updateAccountInfoDto.email} same as your old email`,
        });
      }

      if (user && user._id.toString() !== userId) {
        throw APIResponse.Error(HttpStatus.CONFLICT, {
          email: `${updateAccountInfoDto.email} is being used by another account`,
        });
      }
    }

    await this.usersService.findOneAndUpdate(
      { _id: userId },
      updateAccountInfoDto,
    );

    return APIResponse.Success(null, 'update account info success');
  }
}
