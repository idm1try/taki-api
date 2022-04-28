import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
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
}
