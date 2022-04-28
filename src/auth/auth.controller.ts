import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from '../helpers';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { SigninEmailDto } from './dtos/signin-email.dto';

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
}
