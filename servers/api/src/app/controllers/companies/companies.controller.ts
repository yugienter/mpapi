import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CompanyInformationDto } from '@/app/controllers/dto/company.dto';
import { CompanyDetailResponse } from '@/app/controllers/viewmodels/company.response';
import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { Company, StatusOfInformation } from '@/app/models/company';
import { RolesEnum, User } from '@/app/models/user';
import { CompaniesService, CompanyDetail } from '@/app/services/companies/companies.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('companies')
@UseGuards(RolesGuard)
export class CompaniesController implements Coded {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService, private readonly usersService: UsersService) {}

  get code(): string {
    return 'CCP';
  }

  @ApiOperation({ description: 'Create a new company of user', tags: ['company'] })
  @Post('new/information')
  @Roles(RolesEnum.company)
  async createCompanyInfo(
    @Req() request,
    @Body() createCompanyInformationDto: CompanyInformationDto,
  ): Promise<CompanyDetailResponse> {
    const requesterId = request.raw.user.uid;
    if (![StatusOfInformation.DRAFT, StatusOfInformation.SUBMITTED].includes(createCompanyInformationDto.status)) {
      this.logger.error('[createCompany] : Invalid status');
      throw Error('Invalid status of Information');
    }
    const createdCompany = await this.companiesService.createCompanyInfo(createCompanyInformationDto, requesterId);

    return createdCompany;
  }

  @ApiOperation({ description: 'Update information of company', tags: ['company'] })
  @Put(':companyId/information')
  @Roles(RolesEnum.company)
  async updateCompanyInfo(
    @Param('companyId') companyId: number,
    @Body() companyInfoDto: CompanyInformationDto,
    @Req() request,
  ): Promise<CompanyDetailResponse> {
    const userId = request.raw.user.uid;
    if (![StatusOfInformation.DRAFT, StatusOfInformation.SUBMITTED].includes(companyInfoDto.status)) {
      this.logger.error('[updateCompanyInfo] : Invalid status');
      throw Error('Invalid status of Information');
    }
    return await this.companiesService.updateCompanyInfo(companyId, companyInfoDto, userId);
  }

  @ApiOperation({ description: 'Get all company of user.', tags: ['company'] })
  @Get('list')
  @Roles(RolesEnum.company)
  async getMyCompanies(@Req() request): Promise<Company[]> {
    const userId = request.raw.user.uid;
    return await this.companiesService.getCompaniesOfUser(userId);
  }

  @ApiOperation({ description: 'Get company information.', tags: ['company'] })
  @Get(':companyId/information')
  @Roles(RolesEnum.company)
  async getCompanyInfo(@Param('companyId') companyId: number, @Req() request) {
    const userId = request.raw.user.uid;
    return this.companiesService.getCompanyInfo(companyId, userId);
  }
}
