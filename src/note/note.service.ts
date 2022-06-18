import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.schema';

@Injectable()
export class NoteService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  public async create(
    userId: string,
    createNoteDto: CreateNoteDto,
  ): Promise<Note> {
    return this.noteModel.create({
      ...createNoteDto,
      user: userId,
    });
  }

  public async getAll(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<Note[]> {
    return this.noteModel.find({ user: userId }).skip(skip).limit(limit).lean();
  }

  public async deleteOne(userId: string, noteId: string): Promise<Note> {
    return this.noteModel.findOneAndRemove({
      _id: noteId,
      user: userId,
    });
  }

  public async deleteMany(userId: string, noteIds: string[]): Promise<void> {
    await this.noteModel.deleteMany({ _id: { $in: noteIds }, user: userId });
  }

  public async update(
    userId: string,
    noteId: string,
    updateNoteDto: UpdateNoteDto,
  ): Promise<Note> {
    return this.noteModel
      .findOneAndUpdate({ _id: noteId, user: userId }, updateNoteDto, {
        returnDocument: 'after',
      })
      .exec();
  }
}
