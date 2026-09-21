import { PartialType } from '@nestjs/swagger';
import { CreateRankingDto } from './create-ranking.dto.js';

export class UpdateRankingDto extends PartialType(CreateRankingDto) {}
