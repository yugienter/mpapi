import { Body, Controller, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { ManualCreateUserRequest } from '@/app/controllers/dto/auth.dto';
import { CompanySummaryDto } from '@/app/controllers/dto/company_summary.dto';
import {
  CreateSummaryTranslationDto,
  UpdateSummaryTranslationDto,
} from '@/app/controllers/dto/company_summary_translation.dto';
import { CompanyDetailResponse } from '@/app/controllers/viewmodels/company.response';
import { CompanySummaryResponse } from '@/app/controllers/viewmodels/company_summary.response';
import { CompanySummaryTranslationResponse } from '@/app/controllers/viewmodels/company_summary_translation.response';
import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { CompanySummary } from '@/app/models/company_summaries';
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

  @Get('/companies/users')
  @Roles(RolesEnum.admin)
  async getCompanyUsers() {
    return this.usersService.getCompanyUsersWithCompanyDetails();
  }

  @Get('/companies/:companyId/information')
  @Roles(RolesEnum.admin)
  async getCompanyInformation(@Param('companyId') companyId: number): Promise<CompanyDetailResponse> {
    return this.companiesService.getCompanyInfoForAdmin(companyId);
  }

  @Get('/companies/:companyInformationId/summaries')
  @Roles(RolesEnum.admin)
  getSummary(@Param('companyInformationId') companyInformationId: number): Promise<CompanySummary> {
    return this.companySummariesService.getSummaryForAdmin(companyInformationId);
  }

  @Post('/companies/:companyInformationId/summaries')
  @Roles(RolesEnum.admin)
  createSummary(
    @Param('companyInformationId') companyInformationId: number,
    @Body() createSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.createSummary(companyInformationId, createSummaryDto);
  }

  @Put('/companies/:companyInformationId/summaries/:summaryId')
  @Roles(RolesEnum.admin)
  updateSummary(
    @Param('companyInformationId') companyInformationId: number,
    @Param('summaryId') summaryId: number,
    @Body() updateSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    return this.companySummariesService.updateSummary(companyInformationId, summaryId, updateSummaryDto);
  }

  @Post('/companies/:companySummaryId/summaries/translations')
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

  @Put('/companies/:companySummaryId/summaries/translations/:translationId')
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

  @Get('/companies/:companySummaryId/summaries/translations')
  @Roles(RolesEnum.admin)
  getSummaryTranslations(
    @Param('companySummaryId') companySummaryId: number,
  ): Promise<CompanySummaryTranslationResponse[]> {
    return this.companySummaryTranslationsService.getSummaryTranslations(companySummaryId);
  }
}
