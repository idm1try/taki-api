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
import { ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard, JwtRefreshGuard } from '../common/guards';
import { AuthService } from './auth.service';
import { RequestWithParsedPayload } from './auth.type';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { DisconnectAccountDto } from './dto/disconnect-account.dto';
import { FacebookDto } from './dto/facebook.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleDto } from './dto/google.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SigninEmailDto } from './dto/signin-email.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() signinEmailDto: SigninEmailDto) {
    return this.authService.signin(signinEmailDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() { user }: RequestWithParsedPayload) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  @Get('account')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  accountInfo(@Req() req: RequestWithParsedPayload) {
    return this.authService.accountInfo(req.user.userId);
  }

  @Patch('password')
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
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @Req() { user }: RequestWithParsedPayload,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.userId, deleteAccountDto);
  }

  @Get('verify')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Req() { user }: RequestWithParsedPayload) {
    return this.authService.verifyEmail(user.userId);
  }

  @Put('verify')
  @HttpCode(HttpStatus.OK)
  confirmVerifyEmail(@Query('verifyKey') verifyKey: string) {
    return this.authService.confirmVerifyEmail(verifyKey);
  }

  @Put('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query('resetPasswordKey') resetPasswordKey: string,
  ) {
    return this.authService.resetPassword(
      resetPasswordKey,
      resetPasswordDto.password,
    );
  }

  @Post('signout')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  signout(@Req() req: RequestWithParsedPayload) {
    return this.authService.signout(req.user.userId);
  }

  @Put('account')
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
  @HttpCode(HttpStatus.OK)
  googleSignIn(@Body() googleDto: GoogleDto) {
    return this.authService.googleSignIn(googleDto.accessToken);
  }

  @Put('connect-google')
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
  @HttpCode(HttpStatus.OK)
  facebookSignIn(@Body() facebookDto: FacebookDto) {
    return this.authService.facebookSignIn(facebookDto.accessToken);
  }

  @Put('connect-facebook')
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

  @Put('connect-email')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  connectEmail(
    @Req() req: RequestWithParsedPayload,
    @Body() connectEmailDto: SigninEmailDto,
  ) {
    return this.authService.connectEmail(req.user.userId, connectEmailDto);
  }

  @Put('unlink-account')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  unlinkAccount(
    @Req() req: RequestWithParsedPayload,
    @Body() disconnectAccountDto: DisconnectAccountDto,
  ) {
    return this.authService.unlinkAccount(
      req.user.userId,
      disconnectAccountDto.type,
    );
  }
}
