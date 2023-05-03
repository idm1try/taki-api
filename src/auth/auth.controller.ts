import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RequestWithParsedPayload } from "./auth.type";
import { DisconnectAccountDto } from "./dto/disconnect-account.dto";
import { FacebookAuthDto } from "./dto/facebook-auth.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SigninEmailDto } from "./dto/signin-email.dto";
import { SignupDto } from "./dto/signup.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("signup")
    @HttpCode(HttpStatus.CREATED)
    signup(
        @Body() signupDto: SignupDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.signup(signupDto, res);
    }

    @Post("signin")
    @HttpCode(HttpStatus.OK)
    signin(
        @Body() signinEmailDto: SigninEmailDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.signin(signinEmailDto, res);
    }

    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.refreshTokens(req, res);
    }

    @Patch("password")
    @UseGuards(JwtAuthGuard)
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

    @Get("verify")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    verifyEmail(@Req() { user }: RequestWithParsedPayload) {
        return this.authService.verifyEmail(user.userId);
    }

    @Put("verify")
    @HttpCode(HttpStatus.OK)
    confirmVerifyEmail(@Query("verifyKey") verifyKey: string) {
        return this.authService.confirmVerifyEmail(verifyKey);
    }

    @Put("forgot-password")
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Put("password")
    @HttpCode(HttpStatus.OK)
    resetPassword(
        @Body() resetPasswordDto: ResetPasswordDto,
        @Query("resetPasswordKey") resetPasswordKey: string,
    ) {
        return this.authService.resetPassword(
            resetPasswordKey,
            resetPasswordDto.password,
        );
    }

    @Post("signout")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    signout(
        @Req() req: RequestWithParsedPayload,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.signout(req.user.userId, res);
    }

    @Post("google")
    @HttpCode(HttpStatus.OK)
    googleSignIn(
        @Body() googleDto: GoogleAuthDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.googleSignIn(googleDto.accessToken, res);
    }

    @Put("connect-google")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    connectGoogle(
        @Req() req: RequestWithParsedPayload,
        @Body() googleDto: GoogleAuthDto,
    ) {
        return this.authService.connectGoogle(
            req.user.userId,
            googleDto.accessToken,
        );
    }

    @Post("facebook")
    @HttpCode(HttpStatus.OK)
    facebookSignIn(
        @Body() facebookDto: FacebookAuthDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.facebookSignIn(facebookDto.accessToken, res);
    }

    @Put("connect-facebook")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    connectFacebook(
        @Req() req: RequestWithParsedPayload,
        @Body() facebookDto: FacebookAuthDto,
    ) {
        return this.authService.connectFacebook(
            req.user.userId,
            facebookDto.accessToken,
        );
    }

    @Put("connect-email")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    connectEmail(
        @Req() req: RequestWithParsedPayload,
        @Body() connectEmailDto: SigninEmailDto,
    ) {
        return this.authService.connectEmail(req.user.userId, connectEmailDto);
    }

    @Put("unlink-account")
    @UseGuards(JwtAuthGuard)
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
