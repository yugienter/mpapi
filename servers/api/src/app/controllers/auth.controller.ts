import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { getAuth as getAuthClient, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';

import { SignInRequest, UserAndCompanyRegisterRequest } from '@/app/controllers/dto/auth.dto';
import { CreateCompanyRequest } from '@/app/controllers/dto/company.dto';
import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { Company } from '@/app/models/company';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { FirebaseInfo } from '@/app/modules/firebase.module';
import { AuthProvider } from '@/app/providers/auth.provider';
import { ConfigProvider } from '@/app/providers/config.provider';
import { CompaniesService } from '@/app/services/companies/companies.service';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Controller('auth')
export class AuthController implements Coded {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly authProvider: AuthProvider,
    private readonly configProvider: ConfigProvider,
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CAT';
  }

  static ERROR_CODES = {
    EMAIL_ALREADY_EXIST: ErrorInfo.getBuilder('EAE', 'email_already_exist'),
    INVALID_EMAIL_OR_PASSWORD: ErrorInfo.getBuilder('IVEP', 'invalid_email_or_password'),
    EMAIL_NOT_VERIFIED: ErrorInfo.getBuilder('ENV', 'email_not_verified'),
    RESTRICTED_MP_PLATFORM: ErrorInfo.getBuilder('RSTJCX', 'restricted_for_only_ma_platform_account'),
  };

  get errorCodes() {
    return AuthController.ERROR_CODES;
  }

  @ApiOperation({
    summary: 'Sign In',
    description: 'Sign In with Email and Password',
    tags: ['auth'],
  })
  @Post('signin')
  async signIn(@Res({ passthrough: true }) response: FastifyReply, @Body() dto: SignInRequest) {
    const auth = getAuthClient(this.firebase.firebaseAppClient);
    let cred: UserCredential;
    try {
      cred = await signInWithEmailAndPassword(auth, dto.email, dto.password);
    } catch (e) {
      this.logger.debug(e);
      throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL_OR_PASSWORD('SI-001'));
    }
    const fireUser = cred.user;
    if (!fireUser.emailVerified) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.EMAIL_NOT_VERIFIED('SI-002'));
    }
    const accessToken = await fireUser.getIdToken();
    const refreshToken = fireUser.refreshToken;
    const result = await this.usersService.getUser(fireUser.uid);
    await this.authProvider.setTokenToCookie(response, accessToken, refreshToken);
    return {
      user: result.user,
    };
  }

  @ApiOperation({
    summary: 'Company User register',
    description: 'For case user register the company info to platform',
    tags: ['auth'],
  })
  @Post('company/signup')
  async createUserAndCompany(@Body() dto: UserAndCompanyRegisterRequest) {
    if (this.configProvider.config.isRestrictedServer && !dto.user.email.match(/@mp-asia\.com$/)) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.RESTRICTED_MP_PLATFORM('SG-001'));
    }

    const emailExist = await this.usersService.checkEmailExists(dto.user.email, RolesEnum.company);
    if (emailExist) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.EMAIL_ALREADY_EXIST(null));
    }

    const createUser: { user: ModifiedUser } = await this.usersService.createNewUser({
      ...dto.user,
      role: RolesEnum.company,
    });
    const userData: User = <User>createUser.user;

    let company: CreateCompanyRequest = new CreateCompanyRequest();
    company = { ...dto.company };
    const companyData: Company = await this.companiesService.create(company);

    this.companiesService.manyToManyCreateCompanyUser(company.position_of_user, companyData, userData);

    // await this.usersService.sendEmailNotificationForRegisterCompany(dto);

    return true;
  }

  @ApiOperation({
    summary: 'Verify User through Token',
    description: 'Verify the user using the token sent in the email',
    tags: ['auth'],
  })
  @Post('verify-email')
  async verifyUser(@Body() body: { token: string }) {
    const user = await this.usersService.findByToken(body.token);

    try {
      await this.usersService.updateVerificationStatus(user.id, true);
    } catch (error) {
      this.logger.error('Failed to update verification status in database', error);
      throw new CodedUnauthorizedException(this.code, this.errorCodes.EMAIL_NOT_VERIFIED('VFE-001'));
    }

    return { success: true, message: 'Success to verification' };
  }

  // @ApiOperation({
  //   summary: '『パスワードを忘れた場合はこちら』',
  //   description: 'パスワードを忘れた場合のメールアドレスによるリセット',
  //   tags: ['auth'],
  // })
  // @Put('reset-password')
  // async updatePasswordWithEmail(@Req() request, @Body() dto: EmailRequest) {
  //   await ValidationUtil.validate(dto, {
  //     type: 'object',
  //     properties: {
  //       email: { type: 'string', maxLength: 200, format: 'email' },
  //     },
  //     required: ['email'],
  //     additionalProperties: true,
  //   });
  //   // await this.usersService.sendPasswordResetEmail(dto.email)
  //   return {};
  // }

  // @ApiOperation({
  //   summary: '内部API',
  //   description: 'メールアドレス変更',
  //   tags: ['others'],
  // })
  // @Get('verification/update-email')
  // // @Render('update-email')
  // async getUpdateEmailVerificationPage(@Query('uid') id, @Query('email') email, @Query('v') verificationCode) {
  //   // await this.usersService.updateEmail(id, email, verificationCode)
  //   // TODO
  //   return 'メールアドレスの変更に成功しました。';
  // }

  // @ApiOperation({
  //   summary: 'Verify Email thought token',
  //   tags: ['auth'],
  // })
  // @Post('verify-email')
  // async verifyEmail(@Body('token') token: string, @Body('userId') userId: string, @Res() res: Response) {
  //   try {
  //     const isVerified = await this.authService.verifyEmailToken(token, userId);

  //     if (isVerified) {
  //       return res.status(HttpStatus.OK).json({
  //         message: 'Email verified successfully',
  //       });
  //     } else {
  //       return res.status(HttpStatus.UNAUTHORIZED).json({
  //         message: 'Invalid token or user ID',
  //       });
  //     }
  //   } catch (error) {
  //     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       message: 'An error occurred while verifying the email',
  //     });
  //   }
  // }

  @ApiOperation({
    summary: 'Log Out',
    tags: ['auth'],
  })
  @Post('signout')
  async signOut(@Res({ passthrough: true }) response: FastifyReply) {
    await this.authProvider.setTokenToCookie(response, null, null);
    return {};
  }
}
