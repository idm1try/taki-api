import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  SchemaDefinitionType,
  FilterQuery,
  UpdateQuery,
} from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { User } from './user.schema';
import { UserProfileSerialization } from './serialization/user-profile.serialization';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  public async create(user: SchemaDefinitionType<User>): Promise<User> {
    return this.userModel.create(user);
  }

  public async findOne(filter: FilterQuery<User>): Promise<User> {
    return this.userModel.findOne(filter).lean();
  }

  public async find(filter: FilterQuery<User>): Promise<User[]> {
    return this.userModel.find(filter).lean();
  }

  public async findOneAndUpdate(
    filter: FilterQuery<User>,
    newUpdates: UpdateQuery<User>,
  ): Promise<User | undefined> {
    return this.userModel.findOneAndUpdate(filter, newUpdates).exec();
  }

  public async getUserInfo(userId: string) {
    const user = await this.findOne({ _id: userId });
    return plainToInstance(UserProfileSerialization, user);
  }

  public async delete(userId: string): Promise<User | undefined> {
    return this.userModel.findOneAndDelete({ _id: userId }).exec();
  }
}