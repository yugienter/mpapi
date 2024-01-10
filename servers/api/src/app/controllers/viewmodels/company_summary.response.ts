import { TypeOfBusinessEnum } from '@/app/models/company_information';
import { CompanySummary, SummaryStatus } from '@/app/models/company_summaries';

export class CompanySummaryResponse {
  id: number;
  country: string;
  title: string;
  content: string;
  type_of_business: TypeOfBusinessEnum;
  status: SummaryStatus;
  companyInformationId: number;
  is_public: boolean;
  card_order: number;
  added_to_master_at: Date | null;
  related_posted_summary: number | null;
  created_at: Date;
  updated_at: Date;

  constructor(summary: CompanySummary, relatedPostedSummary: number = null) {
    this.id = summary.id;
    this.country = summary.country;
    this.title = summary.title;
    this.content = summary.content;
    this.type_of_business = summary.type_of_business;
    this.status = summary.status;
    this.companyInformationId = summary.companyInformation?.id;
    this.is_public = summary.is_public;
    this.card_order = summary.card_order;
    this.related_posted_summary = relatedPostedSummary;
    this.added_to_master_at = summary.added_to_master_at;
    this.created_at = summary.created_at;
    this.updated_at = summary.updated_at;
  }
}
