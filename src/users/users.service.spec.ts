import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { createMock } from '@golevelup/ts-jest';
import { User } from './users.schema';
import { UsersService } from './users.service';

const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: Model,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = createUserDoc({
        email: 'test@gmail.com',
        password: 'secret',
      });

      const spyModelCreate = jest.spyOn(model, 'create').mockResolvedValueOnce({
        ...user,
        password: 'hashed-secret',
      } as never);

      const newUser = await service.create({
        name: user.name,
        password: user.password,
        email: user.email,
      });

      expect(newUser).toEqual({
        ...user,
        password: 'hashed-secret',
      });
      expect(spyModelCreate).toBeCalledWith({
        name: user.name,
        password: user.password,
        email: user.email,
      });
    });
  });

  describe('findOne', () => {
    it('should return undefined if not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<User, User>>({
          exec: jest.fn().mockResolvedValueOnce(undefined),
        }),
      );

      const result = await service.findOne({ email: 'test@gmail.com' });
      expect(result).toBeUndefined();
    });

    it('should return a user when matched filters', async () => {
      const user = createUserDoc({ email: 'test@gmail.com' });
      const spyModelFindOne = jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<User, User>>({
          exec: jest.fn().mockResolvedValueOnce(user),
        }),
      );

      const foundUser = await service.findOne({
        email: user.email,
      });
      expect(foundUser).toEqual(user);
      expect(spyModelFindOne).toBeCalledWith({ email: user.email });
    });
  });

  describe('find', () => {
    it('should return an empty array if not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<User[], User[]>>({
          exec: jest.fn().mockResolvedValueOnce([]),
        }),
      );

      const result = await service.findOne({ email: 'test@gmail.com' });
      expect(result).toEqual([]);
    });

    it('should return an array of users when matched filters', async () => {
      const users = [createUserDoc({ email: 'test1@gmail.com' })];

      const spyModelFind = jest.spyOn(model, 'find').mockReturnValueOnce(
        createMock<Query<User[], User[]>>({
          exec: jest.fn().mockResolvedValue(users),
        }),
      );

      const foundUsers = await service.find({
        email: users[0].email,
      });

      expect(foundUsers).toEqual(users);
      expect(spyModelFind).toBeCalledWith({
        email: users[0].email,
      });
    });
  });
});
