import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Key, KeySchema } from './key.schema';
import { KeyService } from './key.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Key.name, schema: KeySchema }]),
    ],
    providers: [KeyService],
    exports: [KeyService],
})
export class KeyModule {}
