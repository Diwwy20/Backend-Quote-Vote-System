import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsArray, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Quote content must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Quote content must not exceed 1000 characters' })
  content: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Author name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Author name must not exceed 100 characters' })
  author: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Quote content must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Quote content must not exceed 1000 characters' })
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Author name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Author name must not exceed 100 characters' })
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class QuoteQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}