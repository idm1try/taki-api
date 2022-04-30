import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategy/jwt-access.strategy';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { KeyModule } from '../key/key.module';
import { MailModule } from '../mail/mail.module';
import { AuthGoogleModule } from '../auth-google/auth-google.module';
import { AuthFacebookModule } from '../auth-facebook/auth-facebook.module';

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
