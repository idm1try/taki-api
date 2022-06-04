import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Hashing } from '../common/helpers';
import { APIResponse } from '../common/types';
import { KeyService } from '../key/key.service';
import { MailService } from '../mail/mail.service';
import { UserProfileSerialization } from '../user/serialization/user-profile.serialization';
import { User } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthGoogleService } from './auth-google.service';
import { AccountType, Payload, Tokens } from './auth.type';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { SigninEmailDto } from './dto/signin-email.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly keyService: KeyService,
    private readonly authGoogleService: AuthGoogleService,
    private readonly authFacebookService: AuthFacebookService,
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

  public async signup(signupDto: SignupDto): APIResponse<Tokens> {
    const foundUsers = await this.userService.findOne({
      email: signupDto.email,
    });

    if (foundUsers) {
      throw new ConflictException('Email is already used');
    }

    const user = await this.userService.create(signupDto);

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.userService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    await this.mailService.signupSuccess(user.email, user.name);

    return tokens;
  }

  public async signin(signinEmailDto: SigninEmailDto): APIResponse<Tokens> {
    const user = await this.userService.findOne({
      email: signinEmailDto.email,
    });

    if (!user) {
      throw new BadRequestException('Email is not exist');
    }

    const isMatchedPassword = await Hashing.verify(
      user.password,
      signinEmailDto.password,
    );

    if (!isMatchedPassword) {
      throw new BadRequestException('Incorrect password');
    }

    const tokens = await this.generateTokens({
      userId: user?._id,
    });

    await this.userService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return tokens;
  }

  public async refreshTokens(
    userId: string,
    refreshToken: string,
  ): APIResponse<Tokens> {
    const user = await this.userService.findOne({ _id: userId });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenMatch = await Hashing.verify(
      user.refreshToken,
      refreshToken,
    );

    if (!isRefreshTokenMatch) {
      throw new UnauthorizedException('Invalid refreshToken');
    }

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.userService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return tokens;
  }

  public async accountInfo(
    userId: string,
  ): APIResponse<UserProfileSerialization> {
    const user = await this.userService.getUserInfo(userId);

    if (!user) {
      throw new ForbiddenException('Invalid accessToken');
    }

    return user;
  }

  public async updatePassword(
    userId: string,
    password: string,
    newPassword: string,
  ): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    const isMatchedPassword = await Hashing.verify(user.password, password);

    if (!isMatchedPassword) {
      throw new NotAcceptableException('Current password is not match');
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      {
        password: newPassword,
        refreshToken: null,
      },
    );

    await this.mailService.updatePasswordSuccess(user.email, user.name);
  }

  public async deleteAccount(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
  ): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User is not exist');
    }

    const isMatchedPassword = await Hashing.verify(
      user.password,
      deleteAccountDto.password,
    );
    if (!isMatchedPassword) {
      throw new ForbiddenException('Password does not match');
    }

    const deletedAccount = await this.userService.delete(userId);
    await this.mailService.deleteAccountSuccess(
      deletedAccount.email,
      deletedAccount.name,
    );
  }

  public async verifyEmail(userId: string): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User is not exist');
    }
    if (!user.email) {
      throw new ConflictException('Account not had email to verify');
    }

    if (user.isVerify) {
      throw new ConflictException('User is already verify');
    }

    const verifyKey = await this.keyService.create(user._id);
    await this.mailService.verifyEmail(user.email, verifyKey.key, user.name);
  }

  public async confirmVerifyEmail(key: string): APIResponse<void> {
    const verifyKey = await this.keyService.verify(key);
    if (!verifyKey) {
      throw new NotAcceptableException('verifyKey is expired or invalid');
    }

    const user = await this.userService.findOneAndUpdate(
      { _id: verifyKey.user._id },
      { isVerify: true },
    );

    if (!user) {
      throw new NotAcceptableException('verifyKey is expired or invalid');
    }
    await this.keyService.revoke(key);
    await this.mailService.verifyEmailSuccess(user.email, user.name);
  }

  public async signout(userId: string): APIResponse<void> {
    const user = await this.userService.findOneAndUpdate(
      { _id: userId, refreshToken: { $exists: true, $ne: null } },
      { refreshToken: null },
    );

    if (!user) {
      throw new UnauthorizedException('Invalid accessToken');
    }
  }

  public async forgotPassword(email: string): APIResponse<void> {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new NotFoundException('Email is not exist');
    }

    if (!user.isVerify) {
      throw new NotAcceptableException('Email is not verified');
    }

    try {
      const forgotPassword = await this.keyService.create(user._id);
      await this.mailService.forgotPassword(
        user.email,
        forgotPassword.key,
        user.name,
      );
    } catch (error) {
      throw new NotAcceptableException('Reset password email is already sent');
    }
  }

  public async resetPassword(
    forgotPasswordKey: string,
    newPassword: string,
  ): APIResponse<void> {
    const forgotPassword = await this.keyService.verify(forgotPasswordKey);
    if (!forgotPassword) {
      throw new NotAcceptableException(
        'forgotPasswordKey is expired or invalid',
      );
    }

    const user = await this.userService.findOneAndUpdate(
      { _id: forgotPassword.user._id },
      { password: newPassword, refreshToken: null },
    );

    if (!user) {
      throw new NotAcceptableException(
        'forgotPasswordKey is expired or invalid',
      );
    }

    await this.keyService.revoke(forgotPasswordKey);
    await this.mailService.resetPasswordSuccess(user.email, user.name);
  }

  public async updateAccountInfo(
    userId: string,
    updateAccountInfoDto: UpdateAccountDto,
  ): APIResponse<void> {
    if (!Object.keys(updateAccountInfoDto)) {
      throw new NotAcceptableException('Nothing new to update');
    }
    if (updateAccountInfoDto.email) {
      const user = await this.userService.findOne({
        email: updateAccountInfoDto.email,
      });

      if (user && user._id.toString() === userId) {
        throw new NotAcceptableException('New email is same as your old email');
      }

      if (user && user._id.toString() !== userId) {
        throw new ConflictException(
          'New email is being used by another account',
        );
      }
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      updateAccountInfoDto,
    );
  }

  public async googleSignIn(googleAccessToken: string): APIResponse<Tokens> {
    const googleUserInfo = await this.authGoogleService.verify(
      googleAccessToken,
    );
    if (!googleUserInfo) {
      throw new BadRequestException('Google accessToken invalid');
    }

    const user = await this.userService.findOne({
      'google.id': googleUserInfo.id,
    });

    // If not exist account create one
    if (!user) {
      const newUser = await this.userService.create({
        name: googleUserInfo.name,
        google: {
          id: googleUserInfo.id,
          email: googleUserInfo.email,
        },
      });

      const tokens = await this.generateTokens({
        userId: newUser._id,
      });

      await this.userService.findOneAndUpdate(
        { _id: newUser._id },
        {
          refreshToken: tokens.refreshToken,
        },
      );

      // Only send email notification when signin first time
      await this.mailService.signupSuccess(newUser.google.email, newUser.name);

      return tokens;
    }

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.userService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return tokens;
  }

  public async connectGoogle(
    userId: string,
    googleAccessToken: string,
  ): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    if (user?.google?.id) {
      throw new ConflictException('Your account already connect with Google');
    }

    const googleUserInfo = await this.authGoogleService.verify(
      googleAccessToken,
    );

    if (!googleUserInfo) {
      throw new BadRequestException('Google accessToken invalid');
    }

    const isConnectedToAnotherAccount = await this.userService.findOne({
      'google.id': googleUserInfo.id,
    });
    if (isConnectedToAnotherAccount) {
      throw new BadRequestException(
        'This Google account is being connected to another account',
      );
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      { google: { id: googleUserInfo.id, email: googleUserInfo.email } },
    );
  }

  public async facebookSignIn(
    facebookAccessToken: string,
  ): APIResponse<Tokens> {
    const facebookUserInfo = await this.authFacebookService.verify(
      facebookAccessToken,
    );
    if (!facebookUserInfo) {
      throw new BadRequestException('Facebook accessToken invalid');
    }

    const user = await this.userService.findOne({
      'facebook.id': facebookUserInfo.id,
    });

    // If not exist account create one
    if (!user) {
      const newUser = await this.userService.create({
        name: facebookUserInfo.name,
        facebook: {
          id: facebookUserInfo.id,
          email: facebookUserInfo.email,
        },
      });

      const tokens = await this.generateTokens({
        userId: newUser._id,
      });

      await this.userService.findOneAndUpdate(
        { _id: newUser._id },
        {
          refreshToken: tokens.refreshToken,
        },
      );

      // Only send email notification when signin first time
      await this.mailService.signupSuccess(
        newUser.facebook.email,
        newUser.name,
      );

      return tokens;
    }

    const tokens = await this.generateTokens({
      userId: user._id,
    });

    await this.userService.findOneAndUpdate(
      { _id: user._id },
      {
        refreshToken: tokens.refreshToken,
      },
    );

    return tokens;
  }

  public async connectFacebook(
    userId: string,
    facebookAccessToken: string,
  ): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    if (user?.facebook?.id) {
      throw new ConflictException('Your account already connect with Facebook');
    }

    const facebookUserInfo = await this.authFacebookService.verify(
      facebookAccessToken,
    );
    if (!facebookUserInfo) {
      throw new BadRequestException('Facebook accessToken invalid');
    }

    const isConnectedToAnotherAccount = await this.userService.findOne({
      'facebook.id': facebookUserInfo.id,
    });
    if (isConnectedToAnotherAccount) {
      throw new BadRequestException(
        'This Facebook account is being connected to another account',
      );
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      { facebook: { id: facebookUserInfo.id, email: facebookUserInfo.email } },
    );
  }

  public async connectEmail(
    userId: string,
    connectEmailDto: SigninEmailDto,
  ): APIResponse<void> {
    const user = await this.userService.findOne({ _id: userId });
    if (user?.email) {
      throw new ConflictException('Your account already connect with email');
    }

    const userUsingThisEmail = await this.userService.findOne({
      email: connectEmailDto.email,
    });
    if (userUsingThisEmail) {
      throw new BadRequestException(
        'This Email is being connected to another account',
      );
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      { email: connectEmailDto.email, password: connectEmailDto.password },
    );
  }

  private countAuthMethods(user: User): number {
    let count = 0;
    if (user.email) count++;
    if (user.google?.id) count++;
    if (user.facebook?.id) count++;
    return count;
  }

  public async unlinkAccount(userId: string, accountType: AccountType) {
    const user = await this.userService.findOne({ _id: userId });
    if (!user) {
      throw new ForbiddenException('accessToken is not valid');
    }

    const numSigninMethods = this.countAuthMethods(user);
    if (numSigninMethods < 2) {
      throw new NotAcceptableException('Account need atleast 1 sign method');
    }

    switch (accountType) {
      case AccountType.Google:
        this.userService.findOneAndUpdate(
          { _id: userId },
          { $unset: { google: '' } },
        );
        break;
      case AccountType.Facebook:
        this.userService.findOneAndUpdate(
          { _id: userId },
          { $unset: { facebook: '' } },
        );
        break;
      default:
        this.userService.findOneAndUpdate(
          { _id: userId },
          { $unset: { email: '', password: '', isVerify: '' } },
        );
        break;
    }
  }
}
