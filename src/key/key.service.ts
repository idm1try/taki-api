import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Key } from "./key.schema";

@Injectable()
export class KeyService {
    constructor(@InjectModel(Key.name) private keyModel: Model<Key>) {}

    public async create(email: string): Promise<Key> {
        return this.keyModel.create({
            email,
        });
    }

    public async verify(key: string): Promise<Key> {
        return this.keyModel.findOne({ key }).exec();
    }

    public async revoke(key: string): Promise<Key> {
        return this.keyModel.findOneAndRemove({ key }).exec();
    }
}
