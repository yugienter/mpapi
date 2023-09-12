import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { Company } from '@/app/models/company';
import { User } from '@/app/models/user';
import { CompaniesService } from '@/app/services/companies/companies.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';
import { ValidationUtil } from '@/app/utils/validation.util';

import { UserAndCompanyRegisterRequest } from '../dto/auth.dto';
import { CreateCompanyRequest, UpdateCompanyInfoDto } from '../dto/company.dto';

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

    await ValidationUtil.validate(createCompanyDto, {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 195 },
        position_of_user: { type: 'string', maxLength: 50 },
        description_1: { type: 'string' },
        description_2: { type: 'string' },
        country: { type: 'string', maxLength: 50 },
        area: { type: 'string', maxLength: 50 },
        area_other: { type: 'boolean' },
        type_of_business: { type: 'string' },
        commodity: { type: 'string' },
        willing_to: { type: 'boolean' },
        date_of_establishment: { type: 'string' },
        annual_revenue: { type: 'number', nullable: true },
        annual_profit: { type: 'number', nullable: true },
        number_of_employees: { type: 'number', nullable: true },
        sell_of_shares: { type: 'number', nullable: true },
        expected_price_of_shares: { type: 'number', nullable: true },
        expected_price_of_shares_percent: { type: 'number', nullable: true },
        issuance_raise_money: { type: 'number', nullable: true },
        issuance_price_of_shares: { type: 'number', nullable: true },
        issuance_price_of_shares_percent: { type: 'number', nullable: true },
        business_collaboration: { type: 'boolean' },
        collaboration_detail: { type: 'string', nullable: true },
      },
      required: [
        'name',
        'position_of_user',
        'description_1',
        'description_2',
        'country',
        'type_of_business',
        'date_of_establishment',
      ],
      additionalProperties: true,
    });

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
