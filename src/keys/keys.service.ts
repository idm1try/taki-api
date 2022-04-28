import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Key } from './keys.schema';

@Injectable()
export class KeysService {
  constructor(@InjectModel(Key.name) private keyModel: Model<Key>) {}

  public async create(userId: string): Promise<Key> {
    return this.keyModel.create({
      user: userId,
    });
  }

  public async verify(key: string): Promise<Key> {
    return this.keyModel.findOne({ key }).exec();
  }

  public async revoke(key: string): Promise<void> {
    this.keyModel.findOneAndRemove({ key }).exec();
  }
}
