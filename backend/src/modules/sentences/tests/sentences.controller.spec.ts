import { Test, TestingModule } from '@nestjs/testing';
import { SentencesController } from '../sentences.controller.js';
import { SentencesService } from '../sentences.service.js';

describe('SentencesController', () => {
  let controller: SentencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SentencesController],
      providers: [SentencesService],
    }).compile();

    controller = module.get<SentencesController>(SentencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
