import { Module } from '@nestjs/common';
import { AuthGoogleService } from './auth-google.service';

@Module({
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
