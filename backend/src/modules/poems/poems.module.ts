import { Module } from '@nestjs/common';
import { PoemsService } from './poems.service.js';
import { PoemsController } from './poems.controller.js';

@Module({
  controllers: [PoemsController],
  providers: [PoemsService],
})
export class PoemsModule {}
