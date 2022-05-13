import { createMock } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { User } from '../user/user.schema';
import { Task } from './task.schema';
import { TaskService } from './task.service';

export const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

const createTaskDoc = (override: Partial<Task> = {}): Partial<Task> => ({
  id: '1',
  title: 'Task Title Test',
  desc: 'Task Description Test',
  user: createUserDoc() as User,
  ...override,
});

describe('TasksService', () => {
  let service: TaskService;
  let model: Model<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getModelToken(Task.name),
          useValue: Model,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    model = module.get<Model<Task>>(getModelToken(Task.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const task = createTaskDoc({});
      const spyModelCreate = jest
        .spyOn(model, 'create')
        .mockResolvedValueOnce(task as never);

      const response = await service.create(task.user._id, {
        title: task.title,
        desc: task.desc,
      });

      expect(response).toEqual(task);
      expect(spyModelCreate).toBeCalledWith({
        title: task.title,
        user: task.user._id,
        desc: task.desc,
      });
    });
  });

  describe('getAll', () => {
    it('should get all task by userId', async () => {
      const tasks = [
        createTaskDoc({ title: 'Walking' }),
        createTaskDoc({ title: 'Studying' }),
        createTaskDoc({ title: 'Do home work' }),
      ];

      const spyModelFind = jest.spyOn(model, 'find').mockReturnValueOnce(
        createMock<Query<User[], User[]>>({
          skip: jest.fn().mockReturnValueOnce(
            createMock<Query<User[], User[]>>({
              limit: jest.fn().mockReturnValueOnce(
                createMock<Query<User[], User[]>>({
                  lean: jest.fn().mockResolvedValueOnce(tasks as Task[]),
                }),
              ),
            }),
          ),
        }),
      );

      const result = await service.getAll('1', 0, 3);
      expect(result).toEqual(tasks);
      expect(spyModelFind).toBeCalledWith({ user: '1' });
    });
  });

  describe('deleteOne', () => {
    it('should throw error when task not exist', async () => {
      jest
        .spyOn(model, 'deleteOne')
        .mockRejectedValueOnce(new Error('Not exist id'));

      try {
        await service.deleteOne('not-exist-userid-1', 'taskid-1');
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
        expect(error.message).toEqual('Task not found to delete');
      }
    });

    it('should delete a task', async () => {
      const spyModelDeleteOne = jest.spyOn(model, 'deleteOne').mockReturnThis();
      await service.deleteOne('userid-1', 'taskid-1');
      expect(spyModelDeleteOne).toBeCalledWith({
        _id: 'taskid-1',
        user: 'userid-1',
      });
    });
  });

  describe('deleteMany', () => {
    it('should throw error when some tasks not exist', async () => {
      jest
        .spyOn(model, 'deleteMany')
        .mockRejectedValueOnce(new Error('Not exist id'));

      try {
        await service.deleteMany('not-exist-userid-1', [
          'taskid-1',
          'taskid-2',
          'taskid-3',
        ]);
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
        expect(error.message).toEqual('Tasks not found to delete');
      }
    });

    it('should delete a task', async () => {
      const taskIds = ['taskid-1', 'taskid-2', 'taskid-3'];
      const spyModelDeleteMany = jest
        .spyOn(model, 'deleteMany')
        .mockReturnThis();

      await service.deleteMany('userid-1', taskIds);

      expect(spyModelDeleteMany).toBeCalledWith({
        _id: { $in: taskIds },
        user: 'userid-1',
      });
    });
  });

  describe('update', () => {
    it('should throw error when nothing new to update', async () => {
      try {
        await service.update('userid-1', 'taskid-1', {});
      } catch (error) {
        expect(error.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
        expect(error.message).toEqual('Nothing new to update');
      }
    });

    it('should update a task', async () => {
      const task = createTaskDoc();
      const updateTaskDto = { title: 'Updated Title' };

      const spyModelUpdateOne = jest
        .spyOn(model, 'findOneAndUpdate')
        .mockReturnValueOnce(
          createMock<Query<User[], User[]>>({
            exec: jest
              .fn()
              .mockResolvedValueOnce({ ...task, ...updateTaskDto }),
          }),
        );

      const response = await service.update(
        task.user._id,
        task._id,
        updateTaskDto,
      );

      expect(response).toEqual({ ...task, ...updateTaskDto });
      expect(spyModelUpdateOne).toBeCalledWith(
        { _id: task._id, user: task.user._id },
        updateTaskDto,
        {
          returnDocument: 'after',
        },
      );
    });
  });
});
