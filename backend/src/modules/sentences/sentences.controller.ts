import { Controller } from '@nestjs/common';
import { SentencesService } from './sentences.service.js';

@Controller('sentences')
export class SentencesController {
    constructor(private readonly sentencesService: SentencesService) {}
}
