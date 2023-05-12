import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ImgurClient } from "imgur";
import { Model } from "mongoose";
import * as sharp from "sharp";
import { Avatar } from "./avatar.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class AvatarService {
    private readonly client: ImgurClient;

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Avatar.name) private avatarModel: Model<Avatar>,
    ) {
        this.client = new ImgurClient({
            clientId: this.configService.get<string>("imgur.clientId"),
            clientSecret: this.configService.get<string>("imgur.clientSecret"),
        });
    }

    public async upload({
        userId,
        avatar: image,
    }: {
        userId: string;
        avatar: Express.Multer.File;
    }): Promise<string> {
        const avatarCompressed = await sharp(image.buffer)
            .resize(400)
            .toBuffer();

        const response = await this.client.upload({ image: avatarCompressed });

        const avatar = await this.avatarModel.create({
            userId,
            url: response.data.link,
            deletehash: response.data.deletehash,
        });

        return avatar.url;
    }

    public async delete(userId: string) {
        const avatar = await this.avatarModel.findOne({ userId });
        const response = await this.client.deleteImage(avatar.deletehash);
        if (response.success) {
            await avatar.deleteOne();
        }
    }
}
