import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotAcceptableException,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { Hashing } from "../../common/helpers";
import { KeyService } from "../key/key.service";
import { MailService } from "../mail/mail.service";
import { UserProfileSerialization } from "../user/serialization/user-profile.serialization";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { AuthFacebookService } from "./auth-facebook.service";
import { AuthGoogleService } from "./auth-google.service";
import {
    AccountType,
    DecodedToken,
    Payload,
    SerializatedUser,
    Tokens,
} from "./auth.type";
import { SigninEmailDto } from "./dto/signin-email.dto";
import { SignupDto } from "./dto/signup.dto";

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

    private async _updateRefreshToken({
        userId,
        refreshToken,
        response,
    }: {
        userId: string;
        refreshToken: string;
        response: Response;
    }) {
        await this.userService.findOneAndUpdate(
            { _id: userId },
            {
                refreshToken: refreshToken,
            },
        );

        response.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            path: "/api/auth/refresh",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
    }

    private async _signTokens(payload: Payload): Promise<Tokens> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>("auth.jwt.accessSecret"),
                expiresIn: 60 * 15, // 15 minutes
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>(
                    "auth.jwt.refreshSecret",
                ),
                expiresIn: 60 * 60 * 24 * 7, // 7 days
            }),
        ]);

        return { accessToken, refreshToken };
    }

    public async signup(
        signupDto: SignupDto,
        response: Response,
    ): Promise<{ user: SerializatedUser; accessToken: string }> {
        const isExistUserWithEmail = await this.userService.findOne({
            email: signupDto.email,
        });
        if (isExistUserWithEmail) {
            throw new ConflictException(
                "The email address you provided is already in use",
            );
        }

        const user = await this.userService.create({
            ...signupDto,
        });

        const tokens = await this._signTokens({
            userId: user._id,
        });

        await this._updateRefreshToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            response,
        });

        const serializatedUser = plainToInstance(
            UserProfileSerialization,
            user,
        );

        this.mailService.signupSuccess(user.email, user.name);

        return { user: serializatedUser, accessToken: tokens.accessToken };
    }

    public async signin(
        signinEmailDto: SigninEmailDto,
        response: Response,
    ): Promise<{ user: SerializatedUser; accessToken: string }> {
        const user = await this.userService.findOne({
            email: signinEmailDto.email,
        });
        if (!user) {
            throw new NotFoundException("There was a problem logging in");
        }

        const isPasswordCorrect = await Hashing.verify(
            user.password,
            signinEmailDto.password,
        );
        if (!isPasswordCorrect) {
            throw new BadRequestException("There was a problem logging in");
        }

        const tokens = await this._signTokens({
            userId: user?._id,
        });

        await this._updateRefreshToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            response,
        });

        const serializatedUser = plainToInstance(
            UserProfileSerialization,
            user,
        );

        return { user: serializatedUser, accessToken: tokens.accessToken };
    }

    public async refreshTokens(
        request: Request,
        response: Response,
    ): Promise<{ accessToken: string }> {
        const refreshToken = request.cookies.refreshToken as string;
        if (!refreshToken) {
            throw new UnauthorizedException(
                "The refresh token is expired or invalid",
            );
        }

        const decodedRefreshToken = this.jwtService.decode(
            refreshToken,
        ) as DecodedToken;

        const user = await this.userService.findOne({
            _id: decodedRefreshToken.userId,
        });
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException(
                "The refresh token is expired or invalid",
            );
        }

        const isValidRefreshToken = await Hashing.verify(
            user.refreshToken,
            refreshToken,
        );
        if (!isValidRefreshToken) {
            throw new UnauthorizedException(
                "The refresh token is expired or invalid",
            );
        }

        const tokens = await this._signTokens({
            userId: user._id,
        });

        await this._updateRefreshToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            response,
        });

        return { accessToken: tokens.accessToken };
    }

    public async updatePassword(
        userId: string,
        password: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userService.findOne({ _id: userId });
        const isPasswordCorrect = await Hashing.verify(user.password, password);

        if (!isPasswordCorrect) {
            throw new NotAcceptableException("The password is incorrect");
        }

        await this.userService.findOneAndUpdate(
            { _id: userId },
            {
                password: newPassword,
                refreshToken: null,
            },
        );

        this.mailService.updatePasswordSuccess(user.email, user.name);
    }

    public async verifyEmail(userId: string): Promise<void> {
        const user = await this.userService.findOne({ _id: userId });

        if (!user.email) {
            throw new ConflictException(
                "The account does not have an email to verify",
            );
        }

        if (user.isVerify) {
            throw new ConflictException("The account is already verified");
        }

        try {
            const verifyKey = await this.keyService.create(user.email);
            await this.mailService.verifyEmail(
                user.email,
                verifyKey.key,
                user.name,
            );
        } catch (error) {
            throw new NotAcceptableException(
                "An email to verify has already been sent",
            );
        }
    }

    public async confirmVerifyEmail(key: string): Promise<void> {
        const verifyKey = await this.keyService.verify(key);
        if (!verifyKey) {
            throw new NotAcceptableException(
                "The verifyKey is expired or invalid",
            );
        }

        const user = await this.userService.findOneAndUpdate(
            { email: verifyKey.email },
            { isVerify: true },
        );

        if (!user) {
            throw new NotAcceptableException(
                "The verifyKey is expired or invalid",
            );
        }
        await this.keyService.revoke(key);
        await this.mailService.verifyEmailSuccess(user.email, user.name);
    }

    public async signout(userId: string, res: Response): Promise<void> {
        const user = await this.userService.findOneAndUpdate(
            { _id: userId, refreshToken: { $exists: true, $ne: null } },
            { refreshToken: null },
        );

        if (!user) {
            throw new UnauthorizedException("Invalid accessToken");
        }

        res.clearCookie("refreshToken");
    }

    public async forgotPassword(email: string): Promise<void> {
        const user = await this.userService.findOne({ email });

        if (!user) {
            throw new NotFoundException("Email is not exist");
        }

        if (!user.isVerify) {
            throw new NotAcceptableException("Email is not verified");
        }

        try {
            const forgotPassword = await this.keyService.create(email);
            await this.mailService.forgotPassword(
                user.email,
                forgotPassword.key,
                user.name,
            );
        } catch (error) {
            throw new NotAcceptableException(
                "Reset password email is already sent",
            );
        }
    }

    public async resetPassword(
        resetPasswordKey: string,
        newPassword: string,
    ): Promise<void> {
        const forgotPassword = await this.keyService.verify(resetPasswordKey);
        if (!forgotPassword) {
            throw new NotAcceptableException(
                "resetPasswordKey is expired or invalid",
            );
        }

        const user = await this.userService.findOneAndUpdate(
            { email: forgotPassword.email },
            { password: newPassword, refreshToken: null },
        );

        if (!user) {
            throw new NotAcceptableException(
                "resetPasswordKey is expired or invalid",
            );
        }

        await this.keyService.revoke(resetPasswordKey);
        await this.mailService.resetPasswordSuccess(user.email, user.name);
    }

    public async googleSignIn(
        googleAccessToken: string,
        response: Response,
    ): Promise<{ user: SerializatedUser; accessToken: string }> {
        const googleUserInfo = await this.authGoogleService.verify(
            googleAccessToken,
        );
        if (!googleUserInfo) {
            throw new BadRequestException("Google accessToken invalid");
        }

        let user = await this.userService.findOne({
            "google.id": googleUserInfo.id,
        });

        // If not exist account create one
        if (!user) {
            user = await this.userService.create({
                name: googleUserInfo.name,
                google: {
                    id: googleUserInfo.id,
                    email: googleUserInfo.email,
                },
                avatar: googleUserInfo.picture,
            });
        }

        const tokens = await this._signTokens({
            userId: user._id,
        });

        await this._updateRefreshToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            response,
        });

        const serializatedUser = plainToInstance(
            UserProfileSerialization,
            user,
        );

        return { user: serializatedUser, accessToken: tokens.accessToken };
    }

    public async connectGoogle(
        userId: string,
        googleAccessToken: string,
    ): Promise<void> {
        const user = await this.userService.findOne({ _id: userId });
        if (user?.google?.id) {
            throw new ConflictException(
                "Your account already connect with Google",
            );
        }

        const googleUserInfo = await this.authGoogleService.verify(
            googleAccessToken,
        );

        if (!googleUserInfo) {
            throw new BadRequestException("Google accessToken invalid");
        }

        const isConnectedToAnotherAccount = await this.userService.findOne({
            "google.id": googleUserInfo.id,
        });
        if (isConnectedToAnotherAccount) {
            throw new BadRequestException(
                "This Google account is being connected to another account",
            );
        }

        await this.userService.findOneAndUpdate(
            { _id: userId },
            { google: { id: googleUserInfo.id, email: googleUserInfo.email } },
        );
    }

    public async facebookSignIn(
        facebookAccessToken: string,
        response: Response,
    ): Promise<{ user: SerializatedUser; accessToken: string }> {
        const facebookUserInfo = await this.authFacebookService.verify(
            facebookAccessToken,
        );
        if (!facebookUserInfo) {
            throw new BadRequestException("Facebook accessToken invalid");
        }

        let user = await this.userService.findOne({
            "facebook.id": facebookUserInfo.id,
        });

        // If not exist account create one
        if (!user) {
            user = await this.userService.create({
                name: facebookUserInfo.name,
                facebook: {
                    id: facebookUserInfo.id,
                    email: facebookUserInfo.email,
                },
                avatar: facebookUserInfo.picture,
            });
        }

        const tokens = await this._signTokens({
            userId: user._id,
        });

        await this._updateRefreshToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            response,
        });

        const serializatedUser = plainToInstance(
            UserProfileSerialization,
            user,
        );

        return { user: serializatedUser, accessToken: tokens.accessToken };
    }

    public async connectFacebook(
        userId: string,
        facebookAccessToken: string,
    ): Promise<void> {
        const user = await this.userService.findOne({ _id: userId });
        if (user?.facebook?.id) {
            throw new ConflictException(
                "Your account already connect with Facebook",
            );
        }

        const facebookUserInfo = await this.authFacebookService.verify(
            facebookAccessToken,
        );
        if (!facebookUserInfo) {
            throw new BadRequestException("Facebook accessToken invalid");
        }

        const isConnectedToAnotherAccount = await this.userService.findOne({
            "facebook.id": facebookUserInfo.id,
        });
        if (isConnectedToAnotherAccount) {
            throw new BadRequestException(
                "This Facebook account is being connected to another account",
            );
        }

        await this.userService.findOneAndUpdate(
            { _id: userId },
            {
                facebook: {
                    id: facebookUserInfo.id,
                    email: facebookUserInfo.email,
                },
            },
        );
    }

    public async connectEmail(
        userId: string,
        connectEmailDto: SigninEmailDto,
    ): Promise<void> {
        const user = await this.userService.findOne({ _id: userId });
        if (user?.email) {
            throw new ConflictException(
                "Your account already connect with email",
            );
        }

        const userUsingThisEmail = await this.userService.findOne({
            email: connectEmailDto.email,
        });
        if (userUsingThisEmail) {
            throw new BadRequestException(
                "This Email is being connected to another account",
            );
        }

        await this.userService.findOneAndUpdate(
            { _id: userId },
            {
                email: connectEmailDto.email,
                password: connectEmailDto.password,
            },
        );
    }

    private _countAuthMethods(user: User): number {
        let count = 0;
        if (user.email) count++;
        if (user.google?.id) count++;
        if (user.facebook?.id) count++;
        return count;
    }

    public async unlinkAccount(userId: string, accountType: AccountType) {
        const user = await this.userService.findOne({ _id: userId });

        const numSigninMethods = this._countAuthMethods(user);
        if (numSigninMethods < 2) {
            throw new NotAcceptableException(
                "Account need atleast 1 sign method",
            );
        }
        let unsetFields = {};

        switch (accountType) {
            case AccountType.Google:
                unsetFields = { google: "" };
                break;
            case AccountType.Facebook:
                unsetFields = { facebook: "" };
                break;
            default:
                unsetFields = { email: "", password: "", isVerify: "" };
                break;
        }

        this.userService.findOneAndUpdate(
            { _id: userId },
            { $unset: unsetFields },
        );
    }
}
