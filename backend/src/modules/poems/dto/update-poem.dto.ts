import { PartialType } from '@nestjs/swagger';
import { CreatePoemDto } from './create-poem.dto.js';

export class UpdatePoemDto extends PartialType(CreatePoemDto) {}
