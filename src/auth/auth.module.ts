import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { KeyModule } from '../key/key.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategy/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';

@Module({
    imports: [
        ConfigModule,
        UserModule,
        PassportModule,
        JwtModule.register({}),
        KeyModule,
        MailModule,
    ],
    providers: [
        AuthService,
        AuthGoogleService,
        AuthFacebookService,
        JwtAccessStrategy,
        JwtRefreshStrategy,
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
