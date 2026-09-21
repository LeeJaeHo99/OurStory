import { Module } from '@nestjs/common';
import { SentencesService } from './sentences.service.js';
import { SentencesController } from './sentences.controller.js';

@Module({
  controllers: [SentencesController],
  providers: [SentencesService],
})
export class SentencesModule {}
