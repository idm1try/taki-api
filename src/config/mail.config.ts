import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  logoUrl: process.env.MAIL_LOGO_URL || '',
  port: parseInt(process.env.MAIL_PORT) || 465,
  mail: process.env.MAIL,
  clientId: process.env.MAIL_CLIENTID || '',
  secret: process.env.MAIL_SECRET || '',
  refreshToken: process.env.MAIL_REFRESH_TOKEN || '',
  accessToken: process.env.MAIL_ACCESS_TOKEN || '',
  callbackVerifyUrl: process.env.MAIL_CALLBACK_VERIFY_URL || '',
  callbackResetUrl: process.env.MAIL_CALLBACK_RESET_URL || '',
  callbackLoginUrl: process.env.MAIL_CALLBACK_LOGIN_URL || '',
}));
