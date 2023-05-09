import { Inject, Injectable, PipeTransform, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import * as path from "path";
import * as sharp from "sharp";
import { RequestWithParsedPayload } from "src/auth/auth.type";

@Injectable({ scope: Scope.REQUEST })
export class SharpPipe
    implements PipeTransform<Express.Multer.File, Promise<string>>
{
    constructor(
        @Inject(REQUEST) protected readonly request: RequestWithParsedPayload,
    ) {}

    async transform(image: Express.Multer.File): Promise<string> {
        const filename = `${this.request.user.userId}.webp`;

        await sharp(image.buffer)
            .resize(400)
            .webp({ effort: 3 })
            .toFile(path.join("uploads", filename));

        return filename;
    }
}
