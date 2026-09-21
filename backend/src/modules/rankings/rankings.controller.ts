import { Controller } from '@nestjs/common';
import { RankingsService } from './rankings.service.js';

@Controller('rankings')
export class RankingsController {
    constructor(private readonly rankingsService: RankingsService) {}
}
