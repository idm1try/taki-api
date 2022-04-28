import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { Key } from './keys.schema';
import { KeysService } from './keys.service';

const mockForgotDoc = (override: Partial<Key> = {}): Partial<Key> => ({
  _id: '1',
  key: 'key',
  ...override,
});

describe('KeysService', () => {
  let service: KeysService;
  let model: Model<Key>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeysService,
        {
          provide: getModelToken(Key.name),
          useValue: Model,
        },
      ],
    }).compile();

    service = module.get<KeysService>(KeysService);
    model = module.get<Model<Key>>(getModelToken(Key.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw error when duplicate key', async () => {
      jest
        .spyOn(model, 'create')
        .mockRejectedValueOnce(new Error('duplicate') as never);

      try {
        await service.create('1');
      } catch (error) {
        expect(error.message).toEqual('duplicate');
      }
    });

    it('should return key', async () => {
      const spyModelCreate = jest
        .spyOn(model, 'create')
        .mockResolvedValueOnce(mockForgotDoc() as never);

      const result = await service.create('1');
      expect(result).toEqual(mockForgotDoc());
      expect(spyModelCreate).toBeCalledWith({
        user: '1',
      });
    });
  });

  describe('verify', () => {
    it('should return undefined when key does not exist or invalid', async () => {
      jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<Key, Key>>({
          exec: jest.fn().mockResolvedValueOnce(undefined),
        }),
      );

      const result = await service.verify('a-invalid-forgot-password-key');
      expect(result).toBeUndefined();
    });

    it('should return key instance when create success', async () => {
      const spyModelFindOne = jest.spyOn(model, 'findOne').mockReturnValueOnce(
        createMock<Query<Key, Key>>({
          exec: jest.fn().mockResolvedValueOnce(mockForgotDoc()),
        }),
      );

      const result = await service.verify('mock-key');
      expect(result).toEqual(mockForgotDoc());
      expect(spyModelFindOne).toBeCalledWith({ key: 'mock-key' });
    });
  });

  describe('revoke', () => {
    it('should throw error when key is not valid', async () => {
      jest.spyOn(model, 'findOneAndRemove').mockReturnValueOnce(
        createMock<Query<Key, Key>>({
          exec: jest
            .fn()
            .mockImplementationOnce(() => new Error('key not exist')),
        }),
      );
      try {
        await service.revoke('invalid-key');
      } catch (error) {
        expect(error.message).toEqual('key not exist');
      }
    });

    it('should revoke if given key valid', async () => {
      const spyModelFindOneAndRemove = jest
        .spyOn(model, 'findOneAndRemove')
        .mockReturnValueOnce(
          createMock<Query<Key, Key>>({
            exec: jest.fn(),
          }),
        );
      await service.revoke('valid-key');
      expect(spyModelFindOneAndRemove).toBeCalledWith({ key: 'valid-key' });
    });
  });
});
