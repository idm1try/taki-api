import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  SchemaDefinitionType,
  FilterQuery,
  UpdateQuery,
} from 'mongoose';
import { User } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  public async create(user: SchemaDefinitionType<User>): Promise<User> {
    return this.userModel.create(user);
  }

  public async findOne(filter: FilterQuery<User>): Promise<User> {
    return this.userModel.findOne(filter).exec();
  }

  public async find(filter: FilterQuery<User>): Promise<User[]> {
    return this.userModel.find(filter).exec();
  }

  public async findOneAndUpdate(
    filter: FilterQuery<User>,
    newUpdates: UpdateQuery<User>,
  ): Promise<User | undefined> {
    return this.userModel.findOneAndUpdate(filter, newUpdates).exec();
  }
}
