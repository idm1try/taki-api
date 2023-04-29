import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    salt: parseInt(process.env.SALT),
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENTID,
        clientSecret: process.env.GOOGLE_SECRET,
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENTID,
        clientSecret: process.env.FACEBOOK_SECRET,
    },
}));
