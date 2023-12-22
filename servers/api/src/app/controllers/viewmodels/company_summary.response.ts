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

  constructor(summary: CompanySummary) {
    this.id = summary.id;
    this.country = summary.country;
    this.title = summary.title;
    this.content = summary.content;
    this.type_of_business = summary.type_of_business;
    this.status = summary.status;
    this.companyInformationId = summary.companyInformation?.id;
  }
}