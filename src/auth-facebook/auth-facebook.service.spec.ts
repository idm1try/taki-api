import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthFacebookService } from './auth-facebook.service';

describe('AuthFacebookService', () => {
  let service: AuthFacebookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthFacebookService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthFacebookService>(AuthFacebookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
