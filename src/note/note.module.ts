import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NoteController } from "./note.controller";
import { Note, NoteSchema } from "./note.schema";
import { NoteService } from "./note.service";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    ],
    controllers: [NoteController],
    providers: [NoteService],
})
export class NoteModule {}
