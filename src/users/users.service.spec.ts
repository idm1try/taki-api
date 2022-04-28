import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
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
});
