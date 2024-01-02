import { IsNotEmpty, IsOptional } from 'class-validator';

import { LanguageEnum } from '@/app/models/enum';

export class CreateSummaryTranslationDto {
  @IsNotEmpty()
  language: LanguageEnum;

  @IsNotEmpty()
  title_translated: string;

  @IsNotEmpty()
  content_translated: string;
}

export class UpdateSummaryTranslationDto {
  @IsOptional()
  title_translated?: string;

  @IsOptional()
  content_translated?: string;
}
