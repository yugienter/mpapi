import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getAuth as getAuthClient, signInWithEmailAndPassword } from 'firebase/auth';
import { UserRecord } from 'firebase-admin/auth';
import * as jwt from 'jsonwebtoken';
import _ from 'lodash';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { Company, TypeOfBusinessEnum } from '@/app/models/company';
import { EmailVerificationToken, TokenActionEnum } from '@/app/models/email_verification_tokens';
import { ModifiedUser, RolesEnum, StatusEnum, User } from '@/app/models/user';
import { UserProfile } from '@/app/models/user-profile';
import { FirebaseInfo } from '@/app/modules/firebase.module';
import { UsersPersistence } from '@/app/persistence/users.persistence';
import { ConfigProvider } from '@/app/providers/config.provider';
import { EmailProvider, UserTypeAction } from '@/app/providers/email.provider';
import { I18nProvider } from '@/app/providers/i18n.provider';
import { SlackProvider } from '@/app/providers/slack.provider';
import { StorageProvider } from '@/app/providers/storage.provider';
import { Coded } from '@/app/utils/coded';
import { Service } from '@/app/utils/decorators';
import { convertToMilliseconds } from '@/app/utils/utils';

interface OTPs {
  setEmailVerified: boolean;
  userId: string | null;
}

interface WillingToDetails {
  willingTo: string;
  willingToText: string;
}

interface PayloadGeneratorToken {
  userId: string;
  action: TokenActionEnum;
}

@Injectable()
@Service()
export class UsersService implements Coded {
  private readonly logger = new Logger(UsersService.name);

  static ERROR_CODES = {
    INVALID_ID_USER: ErrorInfo.getBuilder('IID', 'invalid_user_id'),
    INVALID_EMAIL: ErrorInfo.getBuilder('IEML', 'invalid_email'),
    INVALID_VERIFICATION_CODE: ErrorInfo.getBuilder('IVC', 'invalid_verification_code'),
    INVALID_EMAIL_OR_PASSWORD: ErrorInfo.getBuilder('IVEP', 'invalid_email_or_password'),
    USER_ALREADY_IN_USE: ErrorInfo.getBuilder('AIU', 'already_in_use'),
    FAILED_TO_CREATE_ACCOUNT: ErrorInfo.getBuilder('FCA', 'failed_to_create_account'),
    USER_ALREADY_IN_RECESS: ErrorInfo.getBuilder('AIRC', 'the_user_is_already_in_recess'),
    TOKEN_EXPIRED: ErrorInfo.getBuilder('TE', 'token_expired'),
    INVALID_TOKEN: ErrorInfo.getBuilder('IT', 'invalid_token'),
    UNKNOWN_ERROR: ErrorInfo.getBuilder('UK', 'unknown_error'),
    USER_NOT_FOUND: ErrorInfo.getBuilder('UNF', 'user_not_found'),
    INSUFFICIENT_ROLE: ErrorInfo.getBuilder('INSUFR', 'insufficient_role'),
    EMAIL_NOT_VERIFIED: ErrorInfo.getBuilder('ENV', 'email_not_verified'),
  };

  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly i18n: I18nProvider,
    private readonly configProvider: ConfigProvider,
    private readonly usersPersistence: UsersPersistence,
    private readonly emailProvider: EmailProvider,
    private readonly storageProvider: StorageProvider,
    private readonly dataSource: DataSource,
    private readonly slackProvider: SlackProvider,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  get code(): string {
    return 'SUS'; // Service - USers
  }

  get errorCodes() {
    return UsersService.ERROR_CODES;
  }

  // Private utility methods
  private async generateToken(payload: PayloadGeneratorToken, expiresIn = '1d'): Promise<string> {
    return jwt.sign(payload, this.configProvider.config.appSecretKey, { expiresIn: expiresIn });
  }

  private async createVerificationToken(
    user: User,
    action: TokenActionEnum,
    expiresIn?: string,
  ): Promise<EmailVerificationToken> {
    try {
      const tokenString = await this.generateToken(
        {
          userId: user.id,
          action: action,
        },
        expiresIn,
      );

      const expiresAt = new Date();
      if (expiresIn) {
        expiresAt.setTime(expiresAt.getTime() + convertToMilliseconds(expiresIn));
      } else {
        expiresAt.setDate(expiresAt.getDate() + 1);
      }

      const token = new EmailVerificationToken();
      token.token = tokenString;
      token.expires_at = expiresAt;
      token.user = user;
      token.type = action;

      return await this.emailVerificationTokenRepository.save(token);
    } catch (error) {
      this.logger.error(error);
      this.logger.log(
        `[createVerificationToken] Unexpected error when creating verification token for user ${user.email}`,
      );
      throw error; // Re-throwing the error to be caught by the calling function
    }
  }

  private async verifyEmailToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.configProvider.config.appSecretKey);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.TOKEN_EXPIRED('VET-001'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_TOKEN('VET-002'));
      } else {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.UNKNOWN_ERROR('VET-003'));
      }
    }
  }

  private async createOrUpdateFirebaseUser(
    t: EntityManager,
    email: string,
    password: string,
    opts: OTPs,
    role?: RolesEnum,
  ): Promise<UserRecord> {
    let userRec = await this.getUserFromFirebase(email);
    if (userRec && !(await t.getRepository(User).findOneBy({ email }))) {
      await this.firebase.auth.deleteUser(userRec.uid);
      userRec = null;
    } else if (userRec?.emailVerified) {
      this.logger.log('Already verified');
      throw new CodedUnauthorizedException(this.code, this.errorCodes.USER_ALREADY_IN_USE('CNU-003'));
    }
    return await this.createOrUpdateUserInFirebase(userRec, email, password, opts, role);
  }

  private async saveUserData(t, userData: Partial<User>): Promise<void> {
    const user = await t.getRepository(User).findOneBy({ id: userData.id, is_deleted: false });
    if (user) {
      await t.update(User, { id: userData.id }, userData);
    } else {
      await t.save(User, userData);
    }
  }

  private async saveUserProfileData(t: EntityManager, profileData: Partial<UserProfile>): Promise<void> {
    const userProfile = await t.getRepository(UserProfile).findOneBy({ user_id: profileData.user_id });
    if (userProfile) {
      await t.update(UserProfile, { user_id: profileData.user_id }, profileData);
    } else {
      await t.save(UserProfile, profileData);
    }
  }

  private getWillingToDetails(company: Company): WillingToDetails {
    let willingToText = '';
    let willingTo = '';

    if (company.type_of_business === TypeOfBusinessEnum.MANUFACTURING) {
      willingToText = 'Are you willing to manufacture products requested by foreign investor/company on a OEM basis?';
    }
    if (company.type_of_business === TypeOfBusinessEnum.DISTRIBUTION) {
      willingToText = 'Are you willing to distribute products from foreign investor/company as a local distributor?';
    }
    if ([TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(company.type_of_business)) {
      willingTo = company.willing_to ? 'Yes' : 'No';
    }

    return { willingTo, willingToText };
  }

  private async sendNotificationCreateOrUpdateCompanyEmail(subject, email, params): Promise<void> {
    try {
      await this.emailProvider.sendNotificationCreateOrUpdateCompanyEmail(subject, email, params);
      this.logger.log(`Send register company email for: ${email}`);
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendEmailNotificationForRegisterCompany] Fail to send email for ${email}`);
    }
  }

  private async sendNotificationCreateOrUpdateForAdmin(subject, email, params): Promise<void> {
    try {
      await this.emailProvider.sendNotificationCreateOrUpdateForAdmin(subject, email, params);
      this.logger.log(
        `Send  ${params.action ? params.action : 'registration'} notification for admin with email: ${email}`,
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendNotificationCreateOrUpdateForAdmin] Fail to send email for ${email}`);
    }
  }

  private async autoVerifyEmail(uid: string, status: boolean): Promise<boolean> {
    try {
      await this.firebase.auth.updateUser(uid, {
        emailVerified: status,
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new Error(
        `[autoVerifyEmail] Failed to auto verify email for user with UID: ${uid}.Status: ${status}. Error: ${error.message}`,
      );
    }
  }

  // Public methods
  async isAccessibleByAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false, role: RolesEnum.admin } });
    return !!user;
  }

  async getUserFromFirebase(email: string): Promise<UserRecord | null> {
    try {
      return await this.firebase.auth.getUserByEmail(email);
    } catch (e) {
      const code: string = e.code;
      if (code !== 'auth/user-not-found') {
        this.logger.error(e);
      }
      return null;
    }
  }

  async createOrUpdateUserInFirebase(
    userRec: UserRecord | null,
    email: string,
    password: string,
    opts: OTPs,
    role?: RolesEnum,
  ): Promise<UserRecord> {
    try {
      const customClaims = { roles: [role] || [] };
      if (userRec) {
        this.logger.log(`update: ${userRec.uid}`);
        await this.firebase.auth.updateUser(userRec.uid, {
          password: password,
          emailVerified: opts.setEmailVerified || userRec.emailVerified,
        });
      } else {
        this.logger.log(`create new user: ${email}`);
        userRec = await this.firebase.auth.createUser({
          ...(opts.userId ? { uid: opts.userId } : {}),
          email: email,
          ...(password ? { password: password } : {}),
          emailVerified: opts.setEmailVerified,
        });
      }
      if (!_.isEmpty(customClaims) || !!userRec.customClaims) {
        this.logger.log(`set custom user claim - role : ${customClaims}`);
        await this.firebase.auth.setCustomUserClaims(userRec.uid, customClaims || userRec.customClaims);
      }
    } catch (e) {
      const code: string = e.code;
      if (code == 'auth/email-already-exists') {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.USER_ALREADY_IN_USE('CNU-001'));
      } else if (code == 'auth/invalid-email') {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL('CNU-002'));
      } else {
        this.logger.error(e);
        throw new CodedUnauthorizedException(this.code, this.errorCodes.FAILED_TO_CREATE_ACCOUNT('CNU-004'));
      }
    }
    return userRec;
  }

  async createNewUser(data: {
    email: string;
    password: string | null;
    role: RolesEnum;
    user_id?: string | null;
    name?: string;
  }): Promise<{ user: ModifiedUser }> {
    const tranResult = await this.dataSource.manager.transaction(async (t) => {
      const userOTPs: OTPs = { setEmailVerified: false, userId: data.user_id ?? null };
      const userRec = await this.createOrUpdateFirebaseUser(t, data.email, data.password, userOTPs, data.role);
      const uid = userRec.uid;
      this.logger.debug(`user: ${uid}`);

      const now = new Date();
      const userData = {
        id: uid,
        email: data.email ?? null,
        name: data.name,
        role: data.role,
        status: StatusEnum.inActive,
        created_at: now,
        updated_at: now,
      };
      await this.saveUserData(t, userData);

      const profileData = { user_id: uid, created_at: now, updated_at: now };
      await this.saveUserProfileData(t, profileData);

      return _.first(await this.usersPersistence.getUsers(t, [uid]));
    });
    return { user: tranResult };
  }

  async sendVerificationEmail(user: User): Promise<void> {
    try {
      this.logger.debug('Sending email...');
      const emailToken = await this.createVerificationToken(user, TokenActionEnum.VERIFY_EMAIL, '1d');
      await this.emailProvider.sendCustomEmailVerification(
        await this.i18n.t('_.email_verification', { lang: 'en' }),
        user.email,
        { emailVerificationToken: emailToken.token },
      );

      this.logger.log(`Send custom email verification for user: ${user.email}`);
    } catch (error) {
      this.logger.log(`[sendCustomEmailVerification] Fail to send email for user ${user.email}`);
      this.logger.error(error);
    }
  }

  async createAdmin(data: { email: string; password: string | null; name?: string }): Promise<{ user: ModifiedUser }> {
    const tranResult = await this.dataSource.manager.transaction(async (t) => {
      const userOTPs: OTPs = { setEmailVerified: true, userId: null };
      const userRec = await this.createOrUpdateFirebaseUser(t, data.email, data.password, userOTPs, RolesEnum.admin);
      const uid = userRec.uid;
      this.logger.debug(`user: ${uid} - Role Admin`);

      const now = new Date();
      const userData = {
        id: uid,
        email: data.email ?? null,
        name: data.name,
        role: RolesEnum.admin,
        status: StatusEnum.active,
        created_at: now,
        updated_at: now,
      };
      await this.saveUserData(t, userData);

      const profileData = { user_id: uid, created_at: now, updated_at: now };
      await this.saveUserProfileData(t, profileData);

      return _.first(await this.usersPersistence.getUsers(t, [uid]));
    });
    return { user: tranResult };
  }

  async checkEmailExists(email: string, roles: RolesEnum): Promise<boolean> {
    return await this.dataSource.manager.transaction(async (transaction) => {
      return await transaction.getRepository(User).exist({ where: { role: In([roles]), email: email } });
    });
  }

  async getUser(id: string): Promise<ModifiedUser> {
    return await this.dataSource.manager.transaction(async (t) => {
      const user = _.first(await this.usersPersistence.getUsers(t, [id], {}));
      if (!user) {
        await this.usersPersistence.deleteUserIfItDoesNotExistInDatabase(t, id);
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GU-001'));
      }

      return user;
    });
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.dataSource.manager.transaction(async (transaction) => {
      return await transaction.getRepository(User).findOne({ where: { email } });
    });
  }

  async getUserByEmailAndRole(email: string, role: RolesEnum): Promise<User> {
    return await this.dataSource.manager.transaction(async (transaction) => {
      const user = await transaction.getRepository(User).findOne({ where: { email, role } });
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.USER_NOT_FOUND('GUBEAR-001'));
      }
      return user;
    });
  }

  async getUserByRoles(roles: RolesEnum[]): Promise<User[]> {
    return await this.dataSource.manager.transaction(async (transaction) => {
      return await transaction.getRepository(User).find({ where: { role: In([roles]) } });
    });
  }

  verifyUserRole(user: User, expectedRole: RolesEnum): void {
    if (user.role !== expectedRole) {
      throw new CodedUnauthorizedException(this.code, this.errorCodes.INSUFFICIENT_ROLE('VUR-001'));
    }
  }

  async findTokenOfUser(user: User, type: TokenActionEnum): Promise<EmailVerificationToken[]> {
    try {
      const token = await this.emailVerificationTokenRepository.find({
        where: { user: { id: user.id, email: user.email }, type },
      });
      return token;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async findAndVerifyByToken(token: string, action: TokenActionEnum): Promise<User | null> {
    const emailToken = await this.dataSource.manager.transaction(async (t: EntityManager) => {
      return t.findOne(EmailVerificationToken, { where: { token: token }, relations: ['user'] });
    });

    if (!emailToken) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('FBT-003'));
    }

    const decodedToken = await this.verifyEmailToken(token);

    if (decodedToken.action !== action) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('FBT-001'));
    }

    return emailToken.user;
  }

  async deleteToken(token: string): Promise<void> {
    try {
      await this.emailVerificationTokenRepository.delete({ token });
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[deleteToken] Fail to deleteToken for token ${token}`);
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.UNKNOWN_ERROR('DT-001'));
    }
  }

  async deleteTokens(tokens: string[]): Promise<void> {
    try {
      await this.emailVerificationTokenRepository.delete({ token: In(tokens) });
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[deleteTokens] Fail to delete tokens ${tokens.join(', ')}`);
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.UNKNOWN_ERROR('DTS-001'));
    }
  }

  async updateVerificationStatus(uid: string, status: boolean): Promise<void> {
    try {
      const verify: boolean = await this.autoVerifyEmail(uid, status);
      const result = await this.dataSource.manager.transaction(async (t: EntityManager) => {
        return t.update(User, { id: uid }, { status: status ? StatusEnum.active : StatusEnum.inActive });
      });
      if (result.affected === 0) {
        this.logger.log(
          `[updateVerificationStatus] Fail to updateVerificationStatus for user with uid ${uid} case UVS-001`,
        );
        if (verify) {
          await this.autoVerifyEmail(uid, !status);
        }
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('UVS-001'));
      }
    } catch (error) {
      await this.autoVerifyEmail(uid, !status);
      this.logger.error(error);
      this.logger.log(`[updateVerificationStatus] Fail to updateVerificationStatus for user ${uid} case UVS-002 `);
      throw new CodedUnauthorizedException(this.code, this.errorCodes.EMAIL_NOT_VERIFIED('UVS-002'));
    }
  }

  async sendEmailNotificationForInfoCompany(
    user: Partial<User>,
    company: Company,
    positionOfUser: string,
    action?: string,
  ): Promise<void> {
    const { willingTo, willingToText } = this.getWillingToDetails(company);
    const params = {
      userName: user.name,
      email: user.email,
      companyName: company.name,
      positionOfUser: positionOfUser,
      description1: company.description_1,
      description2: company.description_2,
      country: company.country,
      area: company.area,
      typeOfBusiness: company.type_of_business,
      commodity: company.commodity,
      willingTo,
      willingToText,
      dateOfEstablishment: company.date_of_establishment,
      annualRevenue: company.annual_revenue,
      annualProfit: company.annual_profit,
      numberOfEmployees: company.number_of_employees,
      sellOfShares: company.sell_of_shares,
      expectedPriceOfShares: company.expected_price_of_shares,
      expectedPriceOfSharesPercent: company.expected_price_of_shares_percent,
      issuanceRaiseMoney: company.issuance_raise_money,
      issuancePriceOfShares: company.issuance_price_of_shares,
      issuancePriceOfSharesPercent: company.issuance_price_of_shares_percent,
      businessCollaboration: company.business_collaboration ? 'Yes' : 'No',
      collaborationDetail: company.collaboration_detail,
      action: action,
    };

    const admins = await this.getUserByRoles([RolesEnum.admin]);
    const adminEmails = _.map(admins, (admin) => admin.email);
    // for admin right now
    const config = this.configProvider.config;
    if (config.appEnv == 'production') {
      adminEmails.push('mpa@mp-asia.com');
    }
    const userEmail = user.email;

    let subjectAdmin = await this.i18n.t('_.email_register_company_for_admin', { lang: 'en' });
    let subjectUser = await this.i18n.t('_.email_register_company_for_user', { lang: 'en' });

    if (action) {
      if ((action = UserTypeAction.create)) {
        subjectUser = await this.i18n.t('_.email_create_new_company_for_user', { lang: 'en' });
      }
      if ((action = UserTypeAction.update)) {
        subjectUser = await this.i18n.t('_.email_update_company_for_user', { lang: 'en' });
      }
      subjectAdmin = await this.i18n.t('_.email_create_update_company_for_admin', { lang: 'en' });
    }

    this.sendNotificationCreateOrUpdateCompanyEmail(subjectUser, userEmail, params);

    _.forEach(adminEmails, (email) => {
      this.sendNotificationCreateOrUpdateForAdmin(subjectAdmin, email, params);
    });
  }

  async sendPasswordResetEmail(user: User, email: string): Promise<void> {
    try {
      const token = await this.createVerificationToken(user, TokenActionEnum.RESET_PASSWORD, '1h');

      await this.emailProvider.sendEmailResetPassword(await this.i18n.t('_.password_reset', { lang: 'en' }), email, {
        resetPasswordToken: token.token,
      });

      this.logger.log(`Send password reset email for user: ${email}`);
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendPasswordResetEmail] Fail to send email for user ${email}`);
    }
  }

  async resetPassword(user: User, newPassword: string): Promise<void> {
    try {
      await this.firebase.auth.updateUser(user.id, { emailVerified: true, password: newPassword });
    } catch (error) {
      this.logger.error(error);
      this.logger.log(
        `[resetPassword] [updateUser] Failed to set verify email and new password for user with UID: ${user.id}`,
      );
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.UNKNOWN_ERROR('RSP-001'));
    }

    try {
      await this.dataSource.manager.transaction(async (t) => {
        return t.update(User, { id: user.id }, { status: StatusEnum.active });
      });
    } catch (error) {
      this.logger.error(error);
      this.logger.log(
        `[resetPassword] [transactionUpdate] Failed to set verify email and new password for user with UID: ${user.id}`,
      );
      await this.firebase.auth.updateUser(user.id, { emailVerified: false });
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.UNKNOWN_ERROR('RSP-002'));
    }
  }

  // async updatePassword(id: string, data: { current_password: string; password: string }) {
  //   const tranResult = await this.dataSource.manager.transaction(async (t) => {
  //     const fireUser = await this.firebase.auth.getUser(id);
  //     const auth = getAuthClient(this.firebase.firebaseAppClient);
  //     try {
  //       await signInWithEmailAndPassword(auth, fireUser.email, data.current_password);
  //     } catch (e) {
  //       this.logger.debug(e);
  //       throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL_OR_PASSWORD('UP-001'));
  //     }
  //     await this.firebase.auth.updateUser(id, {
  //       password: data.password,
  //     });

  //     return _.first(await this.usersPersistence.getUsers(t, [id]));
  //   });
  //   return {
  //     user: tranResult,
  //   };
  // }
}

// async updateEmail(id: string, email: string, verificationCode: string) {
//   await this.dataSource.manager.transaction(async (t) => {
//     const fireUser = await this.firebase.auth.getUser(id);
//     this.logger.debug(`${fireUser.customClaims?.verification_code} vs ${verificationCode}`);
//     if (fireUser.customClaims?.verification_code != verificationCode) {
//       throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('UE-001'));
//     }
//     const user = await t.findOneBy(User, { id, is_deleted: false });
//     user.email = email;
//     await t.save(user);
//     await this.firebase.auth.updateUser(id, { email });
//     await this.firebase.auth.setCustomUserClaims(id, { verification_code: null });
//   });
// }

// async updatePassword(id: string, data: { current_password: string; password: string }) {
//   const tranResult = await this.dataSource.manager.transaction(async (t) => {
//     const fireUser = await this.firebase.auth.getUser(id);
//     const auth = getAuthClient(this.firebase.firebaseAppClient);
//     try {
//       await signInWithEmailAndPassword(auth, fireUser.email, data.current_password);
//     } catch (e) {
//       this.logger.debug(e);
//       throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL_OR_PASSWORD('UP-001'));
//     }
//     await this.firebase.auth.updateUser(id, {
//       password: data.password,
//     });

//     return _.first(await this.usersPersistence.getUsers(t, [id]));
//   });
//   return {
//     user: tranResult,
//   };
// }

// async deleteUser(id: string) {
//   await this.dataSource.manager.transaction(async (t) => {
//     const user = await t.findOneBy(User, { id, is_deleted: false });
//     if (!user) {
//       throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('DUS-001'));
//     }
//     user.is_deleted = true;
//     await t.save(user);
//   });
// }

// async getUserDetails(id: string, maxNumberOfSignInHistories = 10) {
//   const tranResult = await this.dataSource.manager.transaction(async (t) => {
//     const users = await this.usersPersistence.getUsers(t, [id], {
//       maxNumberOfSignInHistories: maxNumberOfSignInHistories,
//     });
//     const user = _.first(users);
//     if (!user) {
//       throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GUD-001'));
//     }
//     let fireUser = null;
//     try {
//       fireUser = await this.firebase.auth.getUser(id);
//     } catch (e) {
//       const code: string = e.code;
//       if (code == 'auth/user-not-found') {
//         throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GUD-002'));
//       } else {
//         this.logger.error(e);
//       }
//     }
//     return user;
//   });
//   return {
//     user: tranResult,
//   };
// }

// async updateUser(id: string, data) {
//   const tranResult = await this.dataSource.manager.transaction(async (t) => {
//     const user = await t.findOneBy(User, { id, is_deleted: false });
//     if (!user) {
//       throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('UUSR-001'));
//     }

//     const userProfile = await t.findOneBy(UserProfile, { user_id: id });

//     const now = new Date();
//     const acceptableKeys = _.chain(['name_sei', 'name_mei', 'kana_name_sei', 'kana_name_mei', 'gender', 'birthday'])
//       .invert()
//       .mapValues(() => true)
//       .value();

//     const partialData = {
//       updated_at: now,
//     };
//     _.chain(data)
//       .keys()
//       .filter((x) => acceptableKeys[x])
//       .each((dataKey) => {
//         const dbKey = dataKey == 'gender' ? 'gender_type' : dataKey;
//         partialData[dbKey] = data[dataKey];
//       })
//       .commit();

//     if (userProfile) {
//       await t.update(UserProfile, { user_id: id }, partialData);
//     } else {
//       await t.save(UserProfile, {
//         user_id: id,
//         created_at: now,
//         ...partialData,
//       });
//     }
//     return _.first(await this.usersPersistence.getUsers(t, [id], {}));
//   });
//   return {
//     user: tranResult,
//   };
// }
// }
