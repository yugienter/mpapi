import { Body, Controller, Get, Logger, Param, Put, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CompaniesService } from '@/app/services/companies/companies.service';
import { Coded } from '@/app/utils/coded'; // Import the Coded interface
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('companies')
export class CompaniesController implements Coded {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService) {}

  get code(): string {
    return 'CMP';
  }

  @ApiOperation({
    description: 'Get all company of user.',
    tags: ['company'],
  })
  @Get('list')
  async getMyCompanies(@Req() request) {
    const requesterId = request.raw.uid;
    const result = await this.companiesService.getCompaniesOfUser(requesterId);
    return {
      companies: result,
    };
  }

  @ApiOperation({
    description: 'Get comapny detail of user.',
    tags: ['company'],
  })
  @Get(':companyId')
  async getCompanyDetail(@Param('companyId') companyId: string, @Req() request) {
    const requesterId = request.raw.uid;
    const result = await this.companiesService.getCompanyDetail(companyId, requesterId);

    console.log(result);
    return {
      company: result,
    };
  }
}
