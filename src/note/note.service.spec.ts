import { createMock } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { User } from '../user/user.schema';
import { Note } from './note.schema';
import { NoteService } from './note.service';

export const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

const createNoteDoc = (override: Partial<Note> = {}): Partial<Note> => ({
  id: '1',
  title: 'Note Title Test',
  content: 'Note Content Test',
  user: createUserDoc() as User,
  ...override,
});

describe('NotesService', () => {
  let service: NoteService;
  let model: Model<Note>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        {
          provide: getModelToken(Note.name),
          useValue: Model,
        },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
    model = module.get<Model<Note>>(getModelToken(Note.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a note', async () => {
      const note = createNoteDoc({});
      const spyModelCreate = jest
        .spyOn(model, 'create')
        .mockResolvedValueOnce(note as never);

      const response = await service.create(note.user._id, {
        title: note.title,
        content: note.content,
      });

      expect(response).toEqual(note);
      expect(spyModelCreate).toBeCalledWith({
        title: note.title,
        user: note.user._id,
        content: note.content,
      });
    });
  });

  describe('getAll', () => {
    it('should get all notes by userId', async () => {
      const notes = [
        createNoteDoc({ title: 'Walking' }),
        createNoteDoc({ title: 'Studying' }),
        createNoteDoc({ title: 'Do home work' }),
      ];

      const spyModelFind = jest.spyOn(model, 'find').mockReturnValueOnce(
        createMock<Query<User[], User[]>>({
          skip: jest.fn().mockReturnValueOnce(
            createMock<Query<User[], User[]>>({
              limit: jest.fn().mockReturnValueOnce(
                createMock<Query<User[], User[]>>({
                  lean: jest.fn().mockResolvedValueOnce(notes as Note[]),
                }),
              ),
            }),
          ),
        }),
      );

      const result = await service.getAll('1', 0, 3);
      expect(result).toEqual(notes);
      expect(spyModelFind).toBeCalledWith({ user: '1' });
    });
  });

  describe('deleteOne', () => {
    it('should throw error when note not exist', async () => {
      jest
        .spyOn(model, 'deleteOne')
        .mockRejectedValueOnce(new Error('Not exist id'));

      try {
        await service.deleteOne('not-exist-userid-1', 'noteid-1');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should delete a note', async () => {
      const spyModelDeleteOne = jest.spyOn(model, 'deleteOne').mockReturnThis();
      await service.deleteOne('userid-1', 'noteid-1');
      expect(spyModelDeleteOne).toBeCalledWith({
        _id: 'noteid-1',
        user: 'userid-1',
      });
    });
  });

  describe('deleteMany', () => {
    it('should throw error when some notes not exist', async () => {
      jest
        .spyOn(model, 'deleteMany')
        .mockRejectedValueOnce(new Error('Not exist id'));

      try {
        await service.deleteMany('not-exist-userid-1', [
          'noteid-1',
          'noteid-2',
          'noteid-3',
        ]);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should delete a note', async () => {
      const noteIds = ['noteid-1', 'noteid-2', 'noteid-3'];
      const spyModelDeleteMany = jest
        .spyOn(model, 'deleteMany')
        .mockReturnThis();

      await service.deleteMany('userid-1', noteIds);

      expect(spyModelDeleteMany).toBeCalledWith({
        _id: { $in: noteIds },
        user: 'userid-1',
      });
    });
  });

  describe('update', () => {
    it('should throw error when nothing new to update', async () => {
      try {
        await service.update('userid-1', 'noteid-1', {});
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      }
    });

    it('should update a note', async () => {
      const note = createNoteDoc();
      const updateNoteDto = { title: 'Updated Title' };

      const spyModelUpdateOne = jest
        .spyOn(model, 'findOneAndUpdate')
        .mockReturnValueOnce(
          createMock<Query<Note[], Note[]>>({
            exec: jest
              .fn()
              .mockResolvedValueOnce({ ...note, ...updateNoteDto }),
          }),
        );

      const response = await service.update(
        note.user._id,
        note._id,
        updateNoteDto,
      );

      expect(response).toEqual({ ...note, ...updateNoteDto });
      expect(spyModelUpdateOne).toBeCalledWith(
        { _id: note._id, user: note.user._id },
        updateNoteDto,
        {
          returnDocument: 'after',
        },
      );
    });
  });
});
