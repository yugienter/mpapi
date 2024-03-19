import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { ManualCreateUserRequest } from '@/app/controllers/dto/auth.dto';
import { CreateUpdateAdminNoteDto, CreateUpdateCompanyByAdminDto } from '@/app/controllers/dto/company.dto';
import {
  AddSummaryToMasterDto,
  CompanySummaryDto,
  UpdateSummaryMasterDto,
} from '@/app/controllers/dto/company_summary.dto';
import { SearchSummaryDto } from '@/app/controllers/dto/company_summary_search.dto';
import {
  CreateSummaryTranslationDto,
  UpdateSummaryTranslationDto,
} from '@/app/controllers/dto/company_summary_translation.dto';
import {
  CompanyDetailResponse,
  IAdminNoteResponse,
  ICompanyInfoWithUserResponse,
} from '@/app/controllers/viewmodels/company.response';
import { CompanySummaryResponse, SummaryOptions } from '@/app/controllers/viewmodels/company_summary.response';
import { CompanySummaryTranslationResponse } from '@/app/controllers/viewmodels/company_summary_translation.response';
import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { Company } from '@/app/models/company';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { CompaniesService } from '@/app/services/companies/companies.service';
import { CompanySummariesService } from '@/app/services/companies/companies-summaries.service';
import { CompanySummaryTranslationsService } from '@/app/services/companies/companies-summaries-translation.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController implements Coded {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly companiesService: CompaniesService,
    private readonly companySummariesService: CompanySummariesService,
    private readonly companySummaryTranslationsService: CompanySummaryTranslationsService,
    private readonly usersService: UsersService,
  ) {}

  get code(): string {
    return 'CAD';
  }

  @ApiOperation({
    summary: 'Manual sign up',
    description: 'Admin can manual create user and company info',
    tags: ['admin'],
  })
  @Post('create-user')
  @Roles(RolesEnum.admin)
  async manualCreateUser(@Body() dto: ManualCreateUserRequest): Promise<boolean> {
    // check user is exits or not :
    let userData: User = await this.usersService.getUserByEmail(dto.email);

    const passwordDefault = 'abcd1234';

    if (userData) {
      this.usersService.verifyUserRole(userData, RolesEnum.company);
      // if user in db exits - then check user in firebase
      const firebaseUser = await this.usersService.getUserFromFirebase(dto.email);
      if (!firebaseUser) {
        // if user in firebase is not exits, then create
        // const userOTPs = { setEmailVerified: false, userId: null };
        const userOTPs = { setEmailVerified: true, userId: null };
        await this.usersService.createOrUpdateUserInFirebase(
          null,
          dto.email,
          passwordDefault,
          userOTPs,
          RolesEnum.company,
        );
      }
    } else {
      const createUser: { user: ModifiedUser } = await this.usersService.createNewUser({
        email: dto.email,
        password: passwordDefault,
        role: RolesEnum.company,
        name: dto.name,
        emailVerified: true,
      });
      userData = <User>createUser.user;
    }

    return true;
  }

  @Get('companies/users')
  @Roles(RolesEnum.admin)
  async getCompanyUsers() {
    return this.usersService.getCompanyUsersWithCompanyDetails();
  }

  @Get('companies/:companyId/information')
  @Roles(RolesEnum.admin)
  async getCompanyInformation(@Param('companyId') companyId: number): Promise<ICompanyInfoWithUserResponse> {
    return this.companiesService.getCompanyInfoForAdmin(companyId);
  }

  @Get('companies/:companyInformationId/summaries')
  @Roles(RolesEnum.admin)
  getSummary(@Param('companyInformationId') companyInformationId: number): Promise<CompanySummaryResponse | null> {
    return this.companySummariesService.getSummaryForAdmin(companyInformationId);
  }

  @Get('companies/summaries/:summaryId/posted')
  @Roles(RolesEnum.admin)
  getSummaryPostedById(@Param('summaryId') summaryId: number): Promise<CompanySummaryResponse> {
    return this.companySummariesService.getSummaryPostedByIdForAdmin(summaryId);
  }

  @Post('companies/:companyInformationId/summaries')
  @Roles(RolesEnum.admin)
  createSummary(
    @Param('companyInformationId') companyInformationId: number,
    @Body() createSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.createSummary(companyInformationId, createSummaryDto);
  }

  @Put('companies/:companyInformationId/summaries/:summaryId')
  @Roles(RolesEnum.admin)
  updateSummary(
    @Param('companyInformationId') companyInformationId: number,
    @Param('summaryId') summaryId: number,
    @Body() updateSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.updateSummary(companyInformationId, summaryId, updateSummaryDto);
  }

  @Put('companies/summaries/:summaryId/posted')
  @Roles(RolesEnum.admin)
  updateSummaryMaster(
    @Param('summaryId') summaryId: number,
    @Body() updateSummaryDto: UpdateSummaryMasterDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.updateSummaryMaster(summaryId, updateSummaryDto);
  }

  @Put('companies/:companySummaryId/summaries/add-to-master')
  @Roles(RolesEnum.admin)
  addSummaryToMaster(
    @Param('companySummaryId') companySummaryId: number,
    @Body() addToMasterDto: AddSummaryToMasterDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.addSummaryToMaster(companySummaryId, addToMasterDto);
  }

  @Put('summaries/:summaryId/public-status')
  async changePublicStatus(
    @Param('summaryId') summaryId: number,
    @Body('is_public') is_public: boolean,
  ): Promise<boolean> {
    return this.companySummariesService.changePublicStatus(summaryId, is_public);
  }

  @Post('companies/:companySummaryId/summaries/translations')
  @Roles(RolesEnum.admin)
  createSummaryTranslation(
    @Param('companySummaryId') companySummaryId: number,
    @Body() createSummaryTranslationDto: CreateSummaryTranslationDto,
  ): Promise<CompanySummaryTranslationResponse> {
    return this.companySummaryTranslationsService.createSummaryTranslation(
      companySummaryId,
      createSummaryTranslationDto,
    );
  }

  @Put('companies/:companySummaryId/summaries/translations/:translationId')
  @Roles(RolesEnum.admin)
  updateSummaryTranslation(
    @Param('companySummaryId') companySummaryId: number,
    @Param('translationId') translationId: number,
    @Body() updateSummaryTranslationDto: UpdateSummaryTranslationDto,
  ): Promise<CompanySummaryTranslationResponse> {
    return this.companySummaryTranslationsService.updateSummaryTranslation(
      companySummaryId,
      translationId,
      updateSummaryTranslationDto,
    );
  }

  @Get('companies/:companySummaryId/summaries/translations')
  @Roles(RolesEnum.admin)
  getSummaryTranslations(
    @Param('companySummaryId') companySummaryId: number,
  ): Promise<CompanySummaryTranslationResponse[]> {
    return this.companySummaryTranslationsService.getSummaryTranslations(companySummaryId);
  }

  @Get('summaries/unique-values')
  @Roles(RolesEnum.admin)
  async getUniqueSummaryValues(): Promise<SummaryOptions> {
    return this.companySummariesService.getUniqueSummaryValues({ isAdmin: true });
  }

  @Get('companies/summaries/search')
  @Roles(RolesEnum.admin)
  searchSummaries(@Query() query): Promise<CompanySummaryResponse[]> {
    function toArray(value: string | string[]): string[] {
      return Array.isArray(value) ? value : [value].filter(Boolean);
    }

    const searchSummaryDto = new SearchSummaryDto({
      type_of_business: toArray(query.type_of_business),
      years: toArray(query.years),
      country: toArray(query.country),
      area: toArray(query.area),
      number_of_employees: toArray(query.number_of_employees),
      annual_revenue: toArray(query.annual_revenue),
      keyword: query.keyword,
    });

    return this.companySummariesService.searchSummariesFromAdmin(searchSummaryDto);
  }

  @Get('companies/information/:companyInformationId/admin-notes')
  @Roles(RolesEnum.admin)
  async getAdminNote(@Param('companyInformationId') companyInformationId: number): Promise<IAdminNoteResponse> {
    return this.companiesService.getAdminNoteByCompanyInformationId(companyInformationId);
  }

  @Post('companies/information/:companyInformationId/admin-notes')
  @Roles(RolesEnum.admin)
  async createAdminNote(
    @Param('companyInformationId') companyInformationId: number,
    @Body() createAdminNoteDto: CreateUpdateAdminNoteDto,
  ): Promise<IAdminNoteResponse> {
    return this.companiesService.createAdminNote(companyInformationId, createAdminNoteDto);
  }

  @Put('companies/admin-notes/:adminNoteId')
  @Roles(RolesEnum.admin)
  async updateAdminNote(
    @Param('adminNoteId', ParseIntPipe) adminNoteId: number,
    @Body() updateAdminNoteDto: CreateUpdateAdminNoteDto,
  ): Promise<IAdminNoteResponse> {
    return this.companiesService.updateAdminNote(adminNoteId, updateAdminNoteDto);
  }

  @Get('companies/list')
  @Roles(RolesEnum.admin)
  async getCompanies(): Promise<Company[]> {
    return await this.companiesService.getCompaniesCreateByAdmin();
  }

  @Post('companies')
  @Roles(RolesEnum.admin)
  async createCompany(
    @Req() request,
    @Body() createCompanyDto: CreateUpdateCompanyByAdminDto,
  ): Promise<CompanyDetailResponse> {
    const adminId = request.raw.user.uid;
    return this.companiesService.createCompanyInfoForAdmin(createCompanyDto, adminId);
  }

  @Put('companies/:companyId')
  @Roles(RolesEnum.admin)
  async updateCompany(
    @Param('companyId') companyId: number,
    @Body() updateCompanyDto: CreateUpdateCompanyByAdminDto,
    @Req() request,
  ): Promise<CompanyDetailResponse> {
    const adminId = request.raw.user.uid;
    return this.companiesService.updateCompanyInfoForAdmin(companyId, updateCompanyDto, adminId);
  }
}
