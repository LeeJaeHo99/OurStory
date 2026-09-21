import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service.js';
import { RankingsController } from './rankings.controller.js';

@Module({
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
