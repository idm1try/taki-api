import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { User } from '../users.schema';
import { UserProfileSerialization } from './user-profile.serialization';

describe('user-profile.serialization', () => {
  it('should serialization user info', () => {
    const userInfo: Partial<User> = {
      _id: new Types.ObjectId(),
      name: 'Test User',
      email: 'test@gmail.com',
      password: 'hashed-secret',
      refreshToken: 'hashed-rt',
    };

    const serializationedUserInfo = plainToInstance(
      UserProfileSerialization,
      userInfo,
    );

    expect(serializationedUserInfo).not.toHaveProperty('password');
    expect(serializationedUserInfo).not.toHaveProperty('refreshToken');
  });
});
