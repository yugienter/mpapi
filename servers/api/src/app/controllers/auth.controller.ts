import { Body, Controller, Get, Logger, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { getAuth as getAuthClient, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';

import { SignInRequest, SignupRequest, UserAndCompanyRegisterRequest } from '@/app/controllers/dto/auth.dto';
import { TestRequest } from '@/app/controllers/dto/sample.dto';
import { EmailRequest } from '@/app/controllers/dto/user.dto';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { FirebaseInfo } from '@/app/modules/firebase.module';
import { AuthProvider } from '@/app/providers/auth.provider';
import { ConfigProvider } from '@/app/providers/config.provider';
import { UsersService } from '@/app/services/users/users.service';
import { Coded } from '@/app/utils/coded';
import { MpplatformApiDefault } from '@/app/utils/decorators';
import { ValidationUtil } from '@/app/utils/validation.util';

import { CodedInvalidArgumentException } from '../exceptions/errors/coded-invalid-argument.exception';
import { Company } from '../models/company';
import { ModifiedUser, RolesEnum, User } from '../models/user';
import { CompaniesService } from '../services/companies/companies.service';
import { CreateCompanyRequest } from './dto/company.dto';

/**
 * signinなど、入るときには無認証であるが、認証に関する制御を行う
 */
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

  /**
   * ログイン
   * Cookie処理の都合上、Responseオブジェクトに{passthrough: true}を渡す必要あり。
   */
  @ApiOperation({
    summary: 'WEB用ログイン(Secure Cookie利用)',
    description:
      '通常ログイン(http-only-cookie利用)<br />' +
      'ブラウザで認証が必要な場合にのみ用いる（Swaggerで実行する際やブラウザ上でFirebase-SDKが必要ない場合のみ）。<br />' +
      '（その場合はSDKのsignInWithEmailAndPasswordを用いる）',
    tags: ['auth'],
  })
  @Post('signin')
  async signin(@Res({ passthrough: true }) response: FastifyReply, @Body() dto: SignInRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        email: { type: 'string', maxLength: 200, format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 64 },
      },
      required: ['email', 'password'],
      additionalProperties: true,
    });

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

  /**
   * サインアップ
   */
  @ApiOperation({
    summary: '新規ユーザ作成',
    tags: ['auth'],
  })
  @Post('investor/signup')
  async signup(@Body() dto: SignupRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        email: { type: 'string', maxLength: 255, format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 64 },
        password_confirmation: { const: { $data: '1/password' } },
      },
      required: ['email', 'password', 'password_confirmation'],
      additionalProperties: true,
    });

    if (this.configProvider.config.isRestrictedServer && !dto.email.match(/@mp-asia\.com$/)) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.RESTRICTED_MP_PLATFORM('SG-001'));
    }

    const result = await this.usersService.createNewUser({ ...dto, role: RolesEnum.investor });
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
  async createUserAndCompanyWithoutPassword(@Body() dto: UserAndCompanyRegisterRequest) {
    await ValidationUtil.validate(dto.user, {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 50 },
        email: { type: 'string', maxLength: 255, format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 64 },
        password_confirmation: { const: { $data: '1/password' } },
      },
      required: ['email', 'name', 'password', 'password_confirmation'],
      additionalProperties: true,
    });

    if (this.configProvider.config.isRestrictedServer && !dto.user.email.match(/@mp-asia\.com$/)) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.RESTRICTED_MP_PLATFORM('SG-001'));
    }

    const emailExist = await this.usersService.checkEmailExists(dto.user.email, RolesEnum.company);
    if (emailExist) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.EMAIL_ALREADY_EXIST(null));
    }

    console.log(dto);

    await ValidationUtil.validate(dto.company, {
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

    console.log(2);

    const createUser: { user: ModifiedUser } = await this.usersService.createNewUser({
      ...dto.user,
      role: RolesEnum.company,
    });
    const userData: User = <User>createUser.user;

    let company: CreateCompanyRequest = new CreateCompanyRequest();
    company = { ...dto.company };
    const companyData: Company = await this.companiesService.create(company);

    this.companiesService.manyToManyCreateCompanyUser(company.position_of_user, companyData, userData);

    await this.usersService.sendEmailNotificationForRegisterCompany(dto);

    return true;
  }

  /**
   * ログアウト
   * Cookie処理の都合上、Responseオブジェクトに{passthrough: true}を渡す必要あり。
   */
  @ApiOperation({
    summary: 'WEB用ログアウト',
    tags: ['auth'],
  })
  @Post('signout')
  async signout(@Res({ passthrough: true }) response: FastifyReply) {
    await this.authProvider.setTokenToCookie(response, null, null);
    return {};
  }

  @ApiOperation({
    summary: '『パスワードを忘れた場合はこちら』',
    description: 'パスワードを忘れた場合のメールアドレスによるリセット',
    tags: ['auth'],
  })
  @Put('reset-password')
  async updatePasswordWithEmail(@Req() request, @Body() dto: EmailRequest) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        email: { type: 'string', maxLength: 200, format: 'email' },
      },
      required: ['email'],
      additionalProperties: true,
    });
    // await this.usersService.sendPasswordResetEmail(dto.email)
    return {};
  }

  @ApiOperation({
    summary: '内部API',
    description: 'メールアドレス変更',
    tags: ['others'],
  })
  @Get('verification/update-email')
  // @Render('update-email')
  async getUpdateEmailVerificationPage(@Query('uid') id, @Query('email') email, @Query('v') verificationCode) {
    // await this.usersService.updateEmail(id, email, verificationCode)
    // TODO
    return 'メールアドレスの変更に成功しました。';
  }

  /**
   * ペイロードのハッシュ化でのAPI連携テスト用。本番環境では動作しない。
   * 検証がうまくいったかどうかを返す。
   */
  @ApiOperation({
    summary: '開発環境テスト用',
    tags: ['_sample'],
  })
  @Post('test-communication')
  @ApiBearerAuth('external-comm')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async test(@Req() request, @Body() dto: TestRequest) {
    if (this.configProvider.config.appEnv == 'production') {
      return null;
    }
    return {
      ...(await this.authProvider.checkServerAuthToken(
        (request.headers.authorization?.trim() ?? '(empty)').replace(/^Bearer\s+/, ''),
        request.rawBody.toString(),
      )),
    };
  }
}
