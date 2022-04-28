import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  logoUrl: process.env.MAIL_LOGO_URL || '',
  port: parseInt(process.env.MAIL_PORT) || 465,
  user: process.env.MAIL_USER || '',
  pass: process.env.MAIL_PASS || '',
  callbackVerifyUrl: process.env.MAIL_CALLBACK_VERIFY_URL || '',
  callbackResetUrl: process.env.MAIL_CALLBACK_RESET_URL || '',
  callbackLoginUrl: process.env.MAIL_CALLBACK_LOGIN_URL || '',
}));
