import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  logoUrl: process.env.MAIL_LOGO_URL || '',
  port: parseInt(process.env.MAIL_PORT) || 465,
  callbackVerifyUrl: process.env.MAIL_CALLBACK_VERIFY_URL || '',
  callbackResetUrl: process.env.MAIL_CALLBACK_RESET_URL || '',
  callbackLoginUrl: process.env.MAIL_CALLBACK_LOGIN_URL || '',
  auth: {
    type: process.env.MAIL_AUTH_TYPE,
    user: process.env.MAIL_AUTH_USER,
    clientId: process.env.MAIL_AUTH_CLIENTID,
    clientSecret: process.env.MAIL_AUTH_CLIENTSECRET,
    refreshToken: process.env.MAIL_AUTH_REFRESH,
    redirectUri: process.env.MAIL_AUTH_REDIRECTURI,
  },
}));
