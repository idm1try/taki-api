import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIResponse } from '../common/types';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.schema';

@Injectable()
export class NoteService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  public async create(
    userId: string,
    createNoteDto: CreateNoteDto,
  ): APIResponse<Note> {
    const note = await this.noteModel.create({
      ...createNoteDto,
      user: userId,
    });

    return note;
  }

  public async getAll(
    userId: string,
    skip: number,
    limit: number,
  ): APIResponse<Note[]> {
    return this.noteModel.find({ user: userId }).skip(skip).limit(limit).lean();
  }

  public async deleteOne(userId: string, noteId: string): APIResponse<void> {
    try {
      await this.noteModel.deleteOne({
        _id: noteId,
        user: userId,
      });
    } catch (error) {
      throw new NotAcceptableException('Note not found to delete');
    }
  }

  public async deleteMany(
    userId: string,
    noteIds: string[],
  ): APIResponse<void> {
    try {
      await this.noteModel.deleteMany({ _id: { $in: noteIds }, user: userId });
    } catch (error) {
      throw new NotAcceptableException('Notes not found to delete');
    }
  }

  public async update(
    userId: string,
    noteId: string,
    updateNoteDto: UpdateNoteDto,
  ): APIResponse<Note> {
    if (!Object.keys(updateNoteDto).length) {
      throw new NotAcceptableException('Nothing new to update');
    }

    try {
      const updatedNote = await this.noteModel
        .findOneAndUpdate({ _id: noteId, user: userId }, updateNoteDto, {
          returnDocument: 'after',
        })
        .exec();
      return updatedNote;
    } catch (error) {
      throw new NotAcceptableException('Note not found to update');
    }
  }
}
