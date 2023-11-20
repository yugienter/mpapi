import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { getAuth as getAuthClient, getIdTokenResult, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';

import {
  CompanyUserRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SignInRequest,
  VerifyEmailRequest,
} from '@/app/controllers/dto/auth.dto';
import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { TokenActionEnum } from '@/app/models/email_verification_tokens';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { FirebaseInfo } from '@/app/modules/firebase.module';
import { AuthProvider } from '@/app/providers/auth.provider';
import { ConfigProvider } from '@/app/providers/config.provider';
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
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CAT';
  }

  static ERROR_CODES = {
    INVALID_TOKEN: ErrorInfo.getBuilder('IVT', 'invalid_token'),
    EXPIRED_TOKEN: ErrorInfo.getBuilder('EXT', 'token_error'),
    EMAIL_ALREADY_EXIST: ErrorInfo.getBuilder('EAE', 'email_already_exist'),
    INVALID_EMAIL_OR_PASSWORD: ErrorInfo.getBuilder('IVEP', 'invalid_email_or_password'),
    EMAIL_NOT_VERIFIED: ErrorInfo.getBuilder('ENV', 'email_not_verified'),
    RESTRICTED_MP_PLATFORM: ErrorInfo.getBuilder('RSTJCX', 'restricted_for_only_ma_platform_account'),
    INSUFFICIENT_ROLE: ErrorInfo.getBuilder('INSUFR', 'Insufficient_role'),
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
  async signIn(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() dto: SignInRequest,
  ): Promise<{ user: ModifiedUser }> {
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

    const idTokenResult = await getIdTokenResult(fireUser);
    const customClaims = idTokenResult.claims;
    if (!customClaims.roles || !customClaims.roles.includes(dto.role)) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.INSUFFICIENT_ROLE('SI-003'));
    }

    const accessToken = await fireUser.getIdToken();
    const refreshToken = fireUser.refreshToken;

    const result = await this.usersService.getUser(fireUser.uid);
    this.usersService.verifyUserRole(result as User, dto.role);

    await this.authProvider.setTokenToCookie(response, accessToken, refreshToken);
    return { user: result };
  }

  // Register a new user
  @ApiOperation({
    summary: 'User register',
    description: 'For case user register to platform',
    tags: ['auth'],
  })
  @Post('signup')
  async createUser(@Body() dto: CompanyUserRequest): Promise<boolean> {
    if (this.configProvider.config.isRestrictedServer && !dto.email.match(/@mp-asia\.com$/)) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.RESTRICTED_MP_PLATFORM('SG-001'));
    }

    const emailExist = await this.usersService.checkEmailExists(dto.email, RolesEnum.company);
    if (emailExist) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.EMAIL_ALREADY_EXIST(null));
    }

    const createUser: { user: ModifiedUser } = await this.usersService.createNewUser(dto);

    const userData: User = <User>createUser.user;

    await this.usersService.sendVerificationEmail(userData);

    return true;
  }

  @ApiOperation({
    summary: 'Verify User through Token',
    description: 'Verify the user using the token sent in the email',
    tags: ['auth'],
  })
  @Post('verify-email')
  async verifyUser(@Body() dto: VerifyEmailRequest): Promise<boolean> {
    const user = await this.usersService.findAndVerifyByToken(dto.token, TokenActionEnum.VERIFY_EMAIL);

    this.usersService.verifyUserRole(user, dto.role);

    await this.usersService.updateVerificationStatus(user.id, true);

    await this.usersService.deleteToken(dto.token);

    return true;
  }

  @ApiOperation({
    summary: 'Click here if you have forgotten your password',
    description: 'User can set or reset password by them self through this endpoint',
    tags: ['auth'],
  })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordRequest): Promise<void> {
    const user = await this.usersService.getUserByEmailAndRole(dto.email, RolesEnum.company);

    // find another token about forgot password of this user and then delete this
    const tokenOfUser = await this.usersService.findTokenOfUser(user, TokenActionEnum.RESET_PASSWORD);
    const tokenIds = tokenOfUser.map((token) => token.token);
    await this.usersService.deleteTokens(tokenIds);

    await this.usersService.sendPasswordResetEmail(user, dto.email);
  }

  @ApiOperation({
    summary: 'This endpoint reset your password with new password',
    description: 'Reset by email address if you forget your password',
    tags: ['auth'],
  })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordRequest): Promise<boolean> {
    const user = await this.usersService.findAndVerifyByToken(dto.token, TokenActionEnum.RESET_PASSWORD);

    this.usersService.verifyUserRole(user, dto.role);
    await this.usersService.resetPassword(user, dto.new_password);
    await this.usersService.deleteToken(dto.token);
    return true;
  }

  @Post('create-admin')
  async createAdmin(): Promise<boolean> {
    await this.usersService.createAdmin({ email: 'admin@mp-asia.com', password: 'abcd1234', name: 'admin' });
    return true;
  }

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
