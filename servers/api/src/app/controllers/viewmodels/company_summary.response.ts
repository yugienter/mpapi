import { CompanySummary, SummaryStatus } from '@/app/models/company_summaries';
import { CompanySummaryTranslation } from '@/app/models/company_summaries_translations';

export class CompanySummaryResponse {
  id: number;
  companyId: number;
  country: string;
  area: string;
  title: string;
  content: string;
  type_of_business: string;
  years: string;
  number_of_employees: string;
  annual_revenue: string;
  status: SummaryStatus;
  companyInformationId: number;
  is_public: boolean;
  card_order: number;
  added_to_master_at: Date | null;
  related_posted_summary: number | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  information_created_by_admin: boolean;
  translations?: CompanySummaryTranslation[];

  constructor(summary: CompanySummary, relatedPostedSummary: number = null, translation?: CompanySummaryTranslation) {
    this.id = summary.id;
    this.country = summary.country;
    this.area = summary.area;
    if (translation) {
      this.title = translation.title_translated;
      this.content = translation.content_translated;
    } else {
      this.title = summary.title;
      this.content = summary.content;
    }
    this.type_of_business = summary.type_of_business;
    this.years = summary.years;
    this.number_of_employees = summary.number_of_employees;
    this.annual_revenue = summary.annual_revenue;
    this.status = summary.status;
    this.companyInformationId = summary.companyInformation?.id;
    this.is_public = summary.is_public;
    this.card_order = summary.card_order;
    this.related_posted_summary = relatedPostedSummary;
    this.added_to_master_at = summary.added_to_master_at;
    this.version = summary.version;
    this.created_at = summary.created_at;
    this.updated_at = summary.updated_at;
    this.information_created_by_admin = summary?.companyInformation?.company?.admin ? true : false;
    this.companyId = summary?.companyInformation?.company?.id;
    // for admin users, we want to show all translations
    if (summary?.translations?.length > 0 && summary?.translations?.length > 0) {
      this.translations = summary?.translations;
    }
  }
}

export interface SummaryOptions {
  countries: string[];
  areas: string[];
  type_of_business: string[];
}
