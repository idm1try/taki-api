import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  salt: parseInt(process.env.SALT),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
}));
