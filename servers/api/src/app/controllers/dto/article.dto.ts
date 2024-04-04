import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ArticleStatus } from '@/app/models/articles';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  readonly content: string;

  @IsNotEmpty()
  @IsEnum(ArticleStatus)
  readonly status: ArticleStatus;

  @IsArray()
  readonly uploadedImageIds: number[];

  @IsArray()
  readonly usedImageIds: number[];
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly content: string;

  @IsEnum(ArticleStatus)
  readonly status: ArticleStatus;

  @IsOptional()
  @IsArray()
  readonly uploadedImageIds: number[];

  @IsOptional()
  @IsArray()
  readonly usedImageIds: number[];
}
