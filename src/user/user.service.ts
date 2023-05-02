import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
    FilterQuery,
    Model,
    SchemaDefinitionType,
    UpdateQuery,
} from 'mongoose';
import { SerializatedUser } from '../auth/auth.type';
import { Hashing } from '../common/helpers';
import { MailService } from '../mail/mail.service';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileSerialization } from './serialization/user-profile.serialization';
import { User } from './user.schema';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly mailService: MailService,
    ) {}

    public async create(
        createUserDto: SchemaDefinitionType<User>,
    ): Promise<User> {
        const user = await this.userModel.create(createUserDto);
        return user.toObject();
    }

    public async findOne(filter: FilterQuery<User>): Promise<User> {
        return this.userModel.findOne(filter).lean();
    }

    public async getUserProfile(userId: string): Promise<SerializatedUser> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return plainToInstance(UserProfileSerialization, user.toObject());
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

    public async update(
        userId: string,
        updateUserDto: UpdateUserDto,
    ): Promise<void> {
        if (updateUserDto.email) {
            const user = await this.userModel.findOne({
                email: updateUserDto.email,
            });

            if (user && user._id.toString() !== userId) {
                throw new ConflictException(
                    'New email is being used by another account',
                );
            }
        }

        await this.userModel.findByIdAndUpdate(userId, updateUserDto);
    }

    public async delete(
        userId: string,
        deleteUserDto: DeleteUserDto,
    ): Promise<void> {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('User is not exist');
        }

        const isMatchedPassword = await Hashing.verify(
            user.password,
            deleteUserDto.password,
        );
        if (!isMatchedPassword) {
            throw new ForbiddenException('Password does not match');
        }

        const deletedAccount = await user.deleteOne();

        this.mailService.deleteAccountSuccess(
            deletedAccount.email,
            deletedAccount.name,
        );
    }
}
