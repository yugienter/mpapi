import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';

import { RolesGuard } from '@/app/guards/roles.guard';
import { CompanySummariesService } from '@/app/services/companies/companies-summaries.service';
import { Coded } from '@/app/utils/coded';
import { MpplatformApiDefault } from '@/app/utils/decorators';

import { CompanySummaryListingDto } from '../dto/company_summary.dto';

@MpplatformApiDefault()
@Controller('investor')
@UseGuards(RolesGuard)
export class InvestorController implements Coded {
  private readonly logger = new Logger(InvestorController.name);
  constructor(private readonly companySummariesService: CompanySummariesService) {}

  get code(): string {
    return 'CIN';
  }

  @Get('summaries')
  async getSummaries(@Query() query: CompanySummaryListingDto) {
    function toArray(value: string | string[]): string[] {
      return Array.isArray(value) ? value : [value].filter(Boolean);
    }

    const searchSummaryDto = new CompanySummaryListingDto({
      type_of_business: toArray(query.type_of_business),
      years: toArray(query.years),
      country: toArray(query.country),
      area: toArray(query.area),
      number_of_employees: toArray(query.number_of_employees),
      annual_revenue: toArray(query.annual_revenue),
      keyword: query.keyword,
    });

    return this.companySummariesService.searchSummaries(searchSummaryDto);
  }
}
