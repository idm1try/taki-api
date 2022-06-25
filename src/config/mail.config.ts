import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  logoUrl: process.env.MAIL_LOGO_URL,
  callbackVerifyUrl: process.env.MAIL_CALLBACK_VERIFY_URL,
  callbackResetUrl: process.env.MAIL_CALLBACK_RESET_URL,
  callbackLoginUrl: process.env.MAIL_CALLBACK_LOGIN_URL,
  service: process.env.MAIL_SERVICE,
  rootEmail: process.env.MAIL_ROOT_EMAIL,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PASS,
  },
}));
