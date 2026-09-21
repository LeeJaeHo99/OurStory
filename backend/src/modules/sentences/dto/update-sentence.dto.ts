import { PartialType } from '@nestjs/swagger';
import { CreateSentenceDto } from './create-sentence.dto.js';

export class UpdateSentenceDto extends PartialType(CreateSentenceDto) {}
