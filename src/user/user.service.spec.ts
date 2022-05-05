import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { User } from './user.schema';
import { UserService } from './user.service';

const createUserDoc = (override: Partial<User> = {}): Partial<User> => ({
  _id: '1',
  name: 'Test Name',
  ...override,
});

describe('UsersService', () => {
  let service: UserService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: Model,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
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
          lean: jest.fn().mockResolvedValueOnce(undefined),
        }),
      );

      const result = await service.findOne({ email: 'test@gmail.com' });
      expect(result).toBeUndefined();
    });

    it('should return a user when matched filters', async () => {
      const user = createUserDoc({ email: 'test@gmail.com' });
      const spyModelFindOne = jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<User, User>>({
          lean: jest.fn().mockResolvedValueOnce(user),
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
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      );

      const result = await service.findOne({ email: 'test@gmail.com' });
      expect(result).toEqual([]);
    });

    it('should return an array of users when matched filters', async () => {
      const users = [createUserDoc({ email: 'test1@gmail.com' })];

      const spyModelFind = jest.spyOn(model, 'find').mockReturnValueOnce(
        createMock<Query<User[], User[]>>({
          lean: jest.fn().mockResolvedValue(users),
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

  describe('findOneAndUpdate', () => {
    it('should return undefined if not found user', async () => {
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValueOnce(
        createMock<Query<User, User>>({
          exec: jest.fn().mockResolvedValueOnce(undefined),
        }),
      );

      const result = await service.findOneAndUpdate(
        { _id: '3' },
        { name: 'Ross' },
      );
      expect(result).toBeUndefined();
    });

    it('should update user if filter matched', async () => {
      const spyModelFindOneAndUpdate = jest
        .spyOn(model, 'findOneAndUpdate')
        .mockReturnValueOnce(
          createMock<Query<User, User>>({
            exec: jest
              .fn()
              .mockResolvedValueOnce(createUserDoc({ name: 'Updated Name' })),
          }),
        );

      const result = await service.findOneAndUpdate(
        { _id: '1' },
        { name: 'Updated Name' },
      );
      expect(result).toEqual(createUserDoc({ name: 'Updated Name' }));
      expect(spyModelFindOneAndUpdate).toBeCalledWith(
        { _id: '1' },
        { name: 'Updated Name' },
      );
    });
  });

  describe('getUserInfo', () => {
    it('should return undefined if not found user by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(undefined);

      const foundUser = await service.getUserInfo('2');
      expect(foundUser).toBeUndefined();
    });

    it('should return user info after serialization', async () => {
      const user = createUserDoc({
        name: 'Test Name',
        email: 'test@gmail.com',
        password: 'hashed-secret',
        refreshToken: 'hashed-rt',
      });
      const spyFindOne = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(user as User);

      const userInfo = await service.getUserInfo(user._id);
      expect(userInfo._id).toEqual(user._id);
      expect(userInfo.name).toEqual(user.name);
      expect(userInfo.email).toEqual(user.email);
      expect(userInfo.password).toBeUndefined();
      expect(userInfo.refreshToken).toBeUndefined();
      expect(spyFindOne).toBeCalledWith({ _id: user._id });
    });
  });

  describe('delete', () => {
    it('should return undefined when userId not exist', async () => {
      jest.spyOn(model, 'findOneAndDelete').mockReturnValueOnce(
        createMock<Query<User, User>>({
          exec: jest.fn().mockResolvedValueOnce(undefined),
        }),
      );

      const result = await service.delete('not-exist-id');
      expect(result).toBeUndefined();
    });

    it('should delete user when userId found', async () => {
      const user = createUserDoc({ _id: '1' });
      const spyModelFindOneAndDelete = jest
        .spyOn(model, 'findOneAndDelete')
        .mockReturnValueOnce(
          createMock<Query<User, User>>({
            exec: jest.fn().mockResolvedValueOnce(user),
          }),
        );

      await service.delete(user._id);
      expect(spyModelFindOneAndDelete).toBeCalledWith({ _id: user._id });
    });
  });
});
