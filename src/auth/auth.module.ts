import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthFacebookModule } from '../auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from '../auth-google/auth-google.module';
import { KeyModule } from '../key/key.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
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
    AuthGoogleModule,
    AuthFacebookModule,
  ],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
