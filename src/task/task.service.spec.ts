import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
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
});
