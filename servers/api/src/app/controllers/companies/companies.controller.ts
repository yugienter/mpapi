import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Put, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CompaniesService } from '@/app/services/companies/companies.service';
import { Coded } from '@/app/utils/coded'; // Import the Coded interface
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

import { UpdateCompanyInfoDto } from '../dto/company.dto';

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
    description: 'Get company detail of user.',
    tags: ['company'],
  })
  @Get(':companyId')
  async getCompanyDetail(@Param('companyId') companyId: string, @Req() request) {
    const requesterId = request.raw.uid;
    const result = await this.companiesService.getCompanyDetail(companyId, requesterId);

    return {
      company: result,
    };
  }

  @ApiOperation({
    description: 'Update company information.',
    tags: ['company'],
  })
  @Put(':companyId')
  async updateCompanyInfo(
    @Param('companyId') companyId: string,
    @Req() request,
    @Body() updateCompanyInfoDto: UpdateCompanyInfoDto,
  ) {
    const requesterId = request.raw.uid;
    // Fetch the company to be updated
    const company = await this.companiesService.getCompanyDetail(companyId, requesterId);

    if (!company) {
      throw new HttpException('Company not found or you do not have permission', HttpStatus.FORBIDDEN);
    }

    // Check if the requester is in the list of company users
    if (!company.companiesUsers.some((userRelation) => userRelation.user.id === requesterId)) {
      throw new HttpException('You do not have permission to update this company', HttpStatus.FORBIDDEN);
    }

    // Proceed to update the company
    const updatedCompany = await this.companiesService.updateCompany(companyId, updateCompanyInfoDto);

    return {
      company: updatedCompany,
    };
  }
}
