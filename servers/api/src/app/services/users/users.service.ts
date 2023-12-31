import { Injectable, Logger } from '@nestjs/common';
import { getAuth as getAuthClient, signInWithEmailAndPassword } from 'firebase/auth';
import { UserRecord } from 'firebase-admin/auth';
import * as jwt from 'jsonwebtoken';
import _ from 'lodash';
import { DataSource, EntityManager, In } from 'typeorm';

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { Company, TypeOfBusinessEnum } from '@/app/models/company';
import { EmailVerificationToken } from '@/app/models/email_verification_tokens';
import { RolesEnum, StatusEnum, User } from '@/app/models/user';
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

interface OTPs {
  setEmailVerified: boolean;
  userId: string | null;
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
  ) {}

  get code(): string {
    return 'SUS'; // Service - USers
  }

  get errorCodes() {
    return UsersService.ERROR_CODES;
  }

  // Private utility methods
  private async generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    const payload = { userId, action: 'email-verification' };
    return jwt.sign(payload, this.configProvider.config.appSecretKey, { expiresIn: '1d' });
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

  private async getUserFromFirebase(email: string): Promise<UserRecord | null> {
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

  private async deleteUserFromFirebase(uid: string) {
    await this.firebase.auth.deleteUser(uid);
  }

  private async createOrUpdateUserInFirebase(
    userRec: UserRecord | null,
    email: string,
    password: string,
    opts: OTPs,
  ): Promise<UserRecord> {
    try {
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
          password: password,
          emailVerified: opts.setEmailVerified,
        });
      }
    } catch (e) {
      // https://firebase.google.com/docs/auth/admin/errors
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

  private async createOrUpdateFirebaseUser(
    t: EntityManager,
    email: string,
    password: string,
    opts: OTPs = {
      setEmailVerified: false,
      userId: null,
    },
  ): Promise<UserRecord> {
    let userRec = await this.getUserFromFirebase(email);

    if (userRec && !(await t.getRepository(User).findOneBy({ email }))) {
      await this.deleteUserFromFirebase(userRec.uid);
      userRec = null;
    } else if (userRec?.emailVerified) {
      this.logger.log('Already verified');
      throw new CodedUnauthorizedException(this.code, this.errorCodes.USER_ALREADY_IN_USE('CNU-003'));
    }

    return await this.createOrUpdateUserInFirebase(userRec, email, password, opts);
  }

  private async saveUserData(t: any, userData: any) {
    const user = await t.getRepository(User).findOneBy({ id: userData.id, is_deleted: false });
    if (user) {
      await t.update(User, { id: userData.id }, userData);
    } else {
      await t.save(User, userData);
    }
  }

  private async saveUserProfileData(t: any, profileData: any) {
    const userProfile = await t.getRepository(UserProfile).findOneBy({ user_id: profileData.user_id });
    if (userProfile) {
      await t.update(UserProfile, { user_id: profileData.user_id }, profileData);
    } else {
      await t.save(UserProfile, profileData);
    }
  }

  private async sendVerificationEmail(t: any, user: any, email: string) {
    try {
      const emailVerificationToken = await this.generateEmailVerificationToken(user.id, email);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const emailToken = new EmailVerificationToken();
      emailToken.token = emailVerificationToken;
      emailToken.expires_at = expiresAt;
      emailToken.user = user;

      await t.getRepository(EmailVerificationToken).save(emailToken);

      await this.emailProvider.sendCustomEmailVerification(
        await this.i18n.t('_.email_verification', { lang: 'en' }),
        email,
        { emailVerificationToken },
      );

      this.logger.log(`Send custom email verification for user: ${email}`);
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendCustomEmailVerification] Fail to send email for user ${email}`);
    }
  }

  private getWillingToDetails(company: Company) {
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

  private async sendNotificationCreateOrUpdateCompanyEmail(subject, email, params) {
    try {
      await this.emailProvider.sendNotificationCreateOrUpdateCompanyEmail(subject, email, params);
      this.logger.log(`Send register company email for: ${email}`);
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendEmailNotificationForRegisterCompany] Fail to send email for ${email}`);
    }
  }

  private async sendNotificationCreateOrUpdateForAdmin(subject, email, params) {
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

  private async autoVerifyEmail(uid: string): Promise<void> {
    try {
      await this.firebase.auth.updateUser(uid, {
        emailVerified: true,
      });
    } catch (error) {
      throw new Error(`Failed to auto verify email for user with UID: ${uid}. Error: ${error.message}`);
    }
  }

  // Public methods
  async isAccessibleByAdmin(userId: string): Promise<boolean> {
    return await this.dataSource.manager.transaction(async (t) => {
      const user = await t.findOneBy(User, { id: userId, is_deleted: false, role: RolesEnum.admin });
      if (!user) {
        return false;
      }
      return true;
    });
  }

  async createNewUser(data: {
    email: string;
    password: string;
    role: RolesEnum;
    user_id?: string | null;
    name?: string;
  }) {
    const tranResult = await this.dataSource.manager.transaction(async (t) => {
      const userRec = await this.createOrUpdateFirebaseUser(t, data.email, data.password, {
        setEmailVerified: false,
        userId: data.user_id ?? null,
      });
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

      const profileData = {
        user_id: uid,
        created_at: now,
        updated_at: now,
      };
      await this.saveUserProfileData(t, profileData);

      this.logger.debug('Sending email...');
      await this.sendVerificationEmail(t, userData, data.email);

      return _.first(await this.usersPersistence.getUsers(t, [uid]));
    });
    return {
      user: tranResult,
    };
  }

  async checkEmailExists(email: string, roles: RolesEnum): Promise<boolean> {
    return await this.dataSource.manager.transaction(async (transaction) => {
      return await transaction.getRepository(User).exist({ where: { role: In([roles]), email: email } });
    });
  }

  async getUser(id: string) {
    const tranResult = await this.dataSource.manager.transaction(async (t) => {
      const user = _.first(await this.usersPersistence.getUsers(t, [id], {}));
      if (!user) {
        await this.usersPersistence.deleteUserIfItDoesNotExistInDatabase(t, id);
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GU-001'));
      }
      return user;
    });
    return { user: tranResult };
  }

  async getUserByRoles(roles: RolesEnum[]) {
    return await this.dataSource.manager.transaction(async (transaction) => {
      return await transaction.getRepository(User).find({ where: { role: In([roles]) } });
    });
  }

  async findByToken(token: string): Promise<User | null> {
    const emailToken = await this.dataSource.manager.transaction(async (t: EntityManager) => {
      return t.findOne(EmailVerificationToken, { where: { token: token }, relations: ['user'] });
    });

    if (!emailToken) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('FBT-003'));
    }

    const decodedToken = await this.verifyEmailToken(token);
    const action = decodedToken.action;

    if (action !== 'email-verification') {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('FBT-001'));
    }

    return emailToken.user;
  }

  async deleteEmailVerificationToken(token: string): Promise<void> {
    await this.dataSource.manager.transaction(async (t: EntityManager) => {
      await t.getRepository(EmailVerificationToken).delete({ token: token });
    });
  }

  async updateVerificationStatus(uid: string, status: boolean): Promise<void> {
    await this.autoVerifyEmail(uid);

    const result = await this.dataSource.manager.transaction(async (t: EntityManager) => {
      return t.update(User, { id: uid }, { status: status ? StatusEnum.active : StatusEnum.inActive });
    });
    if (result.affected === 0) {
      throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('UVS-002'));
    }
  }

  async updateEmail(id: string, email: string, verificationCode: string) {
    await this.dataSource.manager.transaction(async (t) => {
      const fireUser = await this.firebase.auth.getUser(id);
      this.logger.debug(`${fireUser.customClaims?.verification_code} vs ${verificationCode}`);
      if (fireUser.customClaims?.verification_code != verificationCode) {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('UE-001'));
      }
      const user = await t.findOneBy(User, { id, is_deleted: false });
      user.email = email;
      await t.save(user);
      await this.firebase.auth.updateUser(id, {
        email,
      });
      await this.firebase.auth.setCustomUserClaims(id, {
        verification_code: null,
      });
    });
  }

  async updatePassword(id: string, data: { current_password: string; password: string }) {
    const tranResult = await this.dataSource.manager.transaction(async (t) => {
      const fireUser = await this.firebase.auth.getUser(id);
      const auth = getAuthClient(this.firebase.firebaseAppClient);
      try {
        await signInWithEmailAndPassword(auth, fireUser.email, data.current_password);
      } catch (e) {
        this.logger.debug(e);
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL_OR_PASSWORD('UP-001'));
      }
      await this.firebase.auth.updateUser(id, {
        password: data.password,
      });

      return _.first(await this.usersPersistence.getUsers(t, [id]));
    });
    return {
      user: tranResult,
    };
  }

  async sendEmailNotificationForInfoCompany(
    user: Partial<User>,
    company: Company,
    positionOfUser: string,
    action?: string,
  ) {
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
    adminEmails.push('mpa@mp-asia.com');
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

    adminEmails.forEach((email) => this.sendNotificationCreateOrUpdateForAdmin(subjectAdmin, email, params));
  }
}

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
