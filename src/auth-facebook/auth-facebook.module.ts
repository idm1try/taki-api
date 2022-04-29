import { Module } from '@nestjs/common';
import { AuthFacebookService } from './auth-facebook.service';

@Module({
  providers: [AuthFacebookService],
  exports: [AuthFacebookService],
})
export class AuthFacebookModule {}
