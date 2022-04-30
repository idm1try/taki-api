import { registerAs } from '@nestjs/config';

export default registerAs('mongo', () => ({
  username: process.env.MONGO_USERNAME || '',
  password: process.env.MONGO_PASSWORD || '',
  name: process.env.MONGO_NAME || '',
  host: process.env.MONGO_HOST || 'localhost',
  port: parseInt(process.env.MONGO_PORT) || 27017,
}));
