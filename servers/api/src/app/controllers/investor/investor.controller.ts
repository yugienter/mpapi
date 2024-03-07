import { Body, Controller, Get, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CompanySummaryListingDto } from '@/app/controllers/dto/company_summary_search.dto';
import { AdminNotificationDto } from '@/app/controllers/dto/investor_request.dto';
import { CompanySummaryResponse, SummaryOptions } from '@/app/controllers/viewmodels/company_summary.response';
import { RolesGuard } from '@/app/guards/roles.guard';
import { LanguageEnum } from '@/app/models/enum';
import { CompanySummariesService } from '@/app/services/companies/companies-summaries.service';
import { Coded } from '@/app/utils/coded';
import { MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Controller('investor')
@UseGuards(RolesGuard)
export class InvestorController implements Coded {
  private readonly logger = new Logger(InvestorController.name);
  constructor(private readonly companySummariesService: CompanySummariesService) {}

  get code(): string {
    return 'CIN';
  }

  @Get('summaries/search/:language')
  async getSummaries(@Query() query, @Param('language') language?: LanguageEnum) {
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
      language: query.language,
    });

    return this.companySummariesService.searchSummariesForInvestor(searchSummaryDto, language);
  }

  @Get('summaries/:summaryId/posted')
  getSummaryPostedById(
    @Param('summaryId') summaryId: number,
    @Query('language') language?: LanguageEnum,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.getSummaryPostedByIdForInvestor(summaryId, language);
  }

  @Get('summaries/unique-values')
  async getUniqueSummaryValues(): Promise<SummaryOptions> {
    return this.companySummariesService.getUniqueSummaryValues();
  }

  @Post('notify-admin-of-new-inquiry')
  async notifyAdminOfNewInquiry(@Body() adminNotificationDto: AdminNotificationDto): Promise<boolean> {
    return this.companySummariesService.notifyAdminOfNewInquiry(adminNotificationDto);
  }
}
