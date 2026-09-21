import { Test, TestingModule } from '@nestjs/testing';
import { PoemsService } from '../poems.service.js';

describe('PoemsService', () => {
  let service: PoemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PoemsService],
    }).compile();

    service = module.get<PoemsService>(PoemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
