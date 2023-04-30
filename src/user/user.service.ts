import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
    FilterQuery,
    Model,
    SchemaDefinitionType,
    UpdateQuery,
} from 'mongoose';
import { UserProfileSerializated } from 'src/auth/auth.type';
import { UserProfileSerialization } from './serialization/user-profile.serialization';
import { User } from './user.schema';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

    public async create(user: SchemaDefinitionType<User>): Promise<User> {
        return this.userModel.create(user);
    }

    public async findOne(filter: FilterQuery<User>): Promise<User> {
        return this.userModel.findOne(filter).lean();
    }

    public serializationUser(user: User): UserProfileSerializated {
        return plainToInstance(UserProfileSerialization, user);
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


    public async delete(userId: string): Promise<User> {
        return this.userModel.findOneAndDelete({ _id: userId }).exec();
    }
}
