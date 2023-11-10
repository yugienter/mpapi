import { Body, Controller, HttpException, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { ManualCreateCompanyUserRequest, ManualCreateUserRequest } from '@/app/controllers/dto/auth.dto';
import { CreateCompanyRequest } from '@/app/controllers/dto/company.dto';
import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { Company } from '@/app/models/company';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { CompaniesService } from '@/app/services/companies/companies.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Authorized()
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController implements Coded {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly companiesService: CompaniesService, private readonly usersService: UsersService) {}

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

  @ApiOperation({
    summary: 'Manual sign up',
    description: 'Admin can manual create user and company info',
    tags: ['admin'],
  })
  @Post('manual-create-company')
  @Roles(RolesEnum.admin)
  async manualSignup(@Body() dto: ManualCreateCompanyUserRequest): Promise<boolean> {
    // check user is exits or not :
    const userData: User = await this.usersService.getUserByEmail(dto.email);

    if (!userData) {
      throw new HttpException('Can not find user in system', HttpStatus.NOT_FOUND);
    }

    this.usersService.verifyUserRole(userData, RolesEnum.company);
    const firebaseUser = await this.usersService.getUserFromFirebase(dto.email);
    if (!firebaseUser) {
      throw new HttpException('Can not find user in firebase', HttpStatus.NOT_FOUND);
    }

    let company: CreateCompanyRequest = new CreateCompanyRequest();
    company = { ...dto.company };
    const companyData: Company = await this.companiesService.create(company);
    this.companiesService.manyToManyCreateCompanyUser(company.position_of_user, companyData, userData);

    return true;
  }
}
