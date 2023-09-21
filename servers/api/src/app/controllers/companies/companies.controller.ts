import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { UserAndCompanyRegisterRequest } from '@/app/controllers/dto/auth.dto';
import { CreateCompanyRequest, UpdateCompanyInfoDto } from '@/app/controllers/dto/company.dto';
import { Company } from '@/app/models/company';
import { User } from '@/app/models/user';
import { CompaniesService } from '@/app/services/companies/companies.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('companies')
export class CompaniesController implements Coded {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService, private readonly usersService: UsersService) {}

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
    description: 'Create a new company and link with user.',
    tags: ['company'],
  })
  @Post()
  async createCompany(@Req() request, @Body() createCompanyDto: CreateCompanyRequest) {
    const requesterId = request.raw.uid;

    const newCompany: { company: Company; user: User } = await this.companiesService.createCompanyAndLinkUser(
      createCompanyDto,
      requesterId,
    );

    if (!newCompany.company) {
      throw new HttpException('Failed to create and link company', HttpStatus.BAD_REQUEST);
    }

    const emailData = {
      user: { email: newCompany.user.email, name: newCompany.user.name },
      company: newCompany,
    } as unknown as Partial<UserAndCompanyRegisterRequest>;

    await this.usersService.sendEmailNotificationForRegisterCompany(emailData);

    return {
      company: newCompany.company,
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
    const company = await this.companiesService.getCompanyDetail(companyId, requesterId);

    if (!company) {
      throw new HttpException('Company not found or you do not have permission', HttpStatus.FORBIDDEN);
    }

    const userRelation = company.companiesUsers.find((userRelation) => userRelation.user.id === requesterId);

    if (!userRelation) {
      throw new HttpException('You do not have permission to update this company', HttpStatus.FORBIDDEN);
    }

    const updatedCompany = await this.companiesService.updateCompany(companyId, updateCompanyInfoDto);

    const emailData = {
      user: { email: userRelation.user.email, name: userRelation.user.name },
      company: updatedCompany,
    } as unknown as Partial<UserAndCompanyRegisterRequest>;

    await this.usersService.sendEmailNotificationForRegisterCompany(emailData);

    return {
      company: updatedCompany,
    };
  }
}
