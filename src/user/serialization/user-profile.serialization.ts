import { Exclude, Type } from 'class-transformer';

export class UserProfileSerialization {
  @Type(() => String)
  readonly _id: string;

  readonly name: string;
  readonly email?: string;
  readonly isVerify?: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  @Exclude()
  readonly password?: string;

  @Exclude()
  readonly refreshToken: string;

  @Exclude()
  readonly __v: string;
}
