import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SchemaDefinitionType } from 'mongoose';
import { User } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  public async create(user: SchemaDefinitionType<User>): Promise<User> {
    return this.userModel.create(user);
  }
}
