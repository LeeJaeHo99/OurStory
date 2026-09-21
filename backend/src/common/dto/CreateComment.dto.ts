import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    text!: string;
    
    @IsString()
    @IsOptional()
    parentId?: string;
}