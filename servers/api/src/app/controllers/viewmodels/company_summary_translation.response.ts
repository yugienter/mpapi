import { CompanySummaryTranslation } from '@/app/models/company_summaries_translations';
import { LanguageEnum } from '@/app/models/enum';

export class CompanySummaryTranslationResponse {
  id: number;
  language: LanguageEnum;
  title_translated: string;
  content_translated: string;
  company_summary_id: number;

  constructor(translation: CompanySummaryTranslation, companySummaryId: number) {
    this.id = translation.id;
    this.company_summary_id = companySummaryId;
    this.language = translation.language;
    this.title_translated = translation.title_translated;
    this.content_translated = translation.content_translated;
  }
}
