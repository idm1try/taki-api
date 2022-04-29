import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiConflictResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from '../helpers';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { SigninEmailDto } from './dtos/signin-email.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RequestWithParsedPayload } from './auth.interfaces';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { DeleteAccountDto } from './dtos/delete-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { GoogleDto } from './dtos/google.dto';
import { FacebookDto } from './dtos/facebook.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Sign up success and return tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Sign up failed, return errors',
  })
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Sign in success and return tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Sign in failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  signin(@Body() signinEmailDto: SigninEmailDto) {
    return this.authService.signin(signinEmailDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('tokens')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Refresh tokens success, return new tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Refresh tokens failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() { user }: RequestWithParsedPayload) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  @Get('account')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Get user info success, return user info',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Get user info failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  accountInfo(@Req() req: RequestWithParsedPayload) {
    return this.authService.accountInfo(req.user.userId);
  }

  @Patch('password')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Update password success, return message',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Update password failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  updatePassword(
    @Req() req: RequestWithParsedPayload,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(
      req.user.userId,
      updatePasswordDto.password,
      updatePasswordDto.newPassword,
    );
  }

  @Delete('account')
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Signin with google success, return new tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Signin with google failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @Req() { user }: RequestWithParsedPayload,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.userId, deleteAccountDto);
  }

  @Get('verify')
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Request success, return message',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Request failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Req() { user }: RequestWithParsedPayload) {
    return this.authService.verifyEmail(user.userId);
  }

  @Put('verify')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Request success, return message',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Request failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  confirmVerifyEmail(@Query('verifyKey') verifyKey: string) {
    return this.authService.confirmVerifyEmail(verifyKey);
  }

  @Post('signout')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Signout success, return message',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Signout failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  signout(@Req() req: RequestWithParsedPayload) {
    return this.authService.signout(req.user.userId);
  }

  @Put('account')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'update account info success, return user info',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'update account info failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  updateAccountInfo(
    @Req() req: RequestWithParsedPayload,
    @Body() updateAccountInfoDto: UpdateAccountDto,
  ) {
    return this.authService.updateAccountInfo(
      req.user.userId,
      updateAccountInfoDto,
    );
  }

  @Post('google')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Signin with google success, return new tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Signin with google failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  googleSignIn(@Body() googleDto: GoogleDto) {
    return this.authService.googleSignIn(googleDto.accessToken);
  }

  @Put('connect-google')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'connect google account success, return user info',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'connect google account failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  connectGoogle(
    @Req() req: RequestWithParsedPayload,
    @Body() googleDto: GoogleDto,
  ) {
    return this.authService.connectGoogle(
      req.user.userId,
      googleDto.accessToken,
    );
  }

  @Post('facebook')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'Signin with facebook success, return new tokens',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'Signin with facebook failed, return errors',
  })
  @HttpCode(HttpStatus.OK)
  facebookSignIn(@Body() facebookDto: FacebookDto) {
    return this.authService.facebookSignIn(facebookDto.accessToken);
  }

  @Put('connect-facebook')
  @ApiOkResponse({
    type: ResponseSuccess,
    description: 'connect facebook account success, return user info',
  })
  @ApiConflictResponse({
    type: ResponseError,
    description: 'connect facebook account failed, return errors',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  connectFacebook(
    @Req() req: RequestWithParsedPayload,
    @Body() facebookDto: FacebookDto,
  ) {
    return this.authService.connectFacebook(
      req.user.userId,
      facebookDto.accessToken,
    );
  }
}
