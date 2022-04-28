import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Key, KeySchema } from './keys.schema';
import { KeysService } from './keys.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Key.name, schema: KeySchema }])],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
