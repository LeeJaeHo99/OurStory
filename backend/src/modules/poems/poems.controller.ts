import { Controller } from '@nestjs/common';
import { PoemsService } from './poems.service.js';

@Controller('poems')
export class PoemsController {
    constructor(private readonly poemsService: PoemsService) {}
}
