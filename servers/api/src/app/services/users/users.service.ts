import { Injectable, Logger } from '@nestjs/common'
import { getAuth as getAuthClient, signInWithEmailAndPassword } from 'firebase/auth'
import { UserRecord } from 'firebase-admin/auth'
import _ from 'lodash'
import moment from 'moment'
import { Brackets, DataSource, EntityManager, In } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { CodedException } from '@/app/exceptions/errors/coded-exception'
import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception'
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { ModifiedUser, User } from '@/app/models/user'
import { UserProfile } from '@/app/models/user-profile'
import { FirebaseInfo } from '@/app/modules/firebase.module'
import { UsersPersistence } from '@/app/persistence/users.persistence'
import { ConfigProvider } from '@/app/providers/config.provider'
import { EmailProvider } from '@/app/providers/email.provider'
import { I18nProvider } from '@/app/providers/i18n.provider'
import { SlackProvider } from '@/app/providers/slack.provider'
import { StorageProvider } from '@/app/providers/storage.provider'
import { Coded } from '@/app/utils/coded'
import { Service } from "@/app/utils/decorators"
import { CONSTANTS } from '@/config/constants'


@Service()
@Injectable()
export class UsersService implements Coded {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly i18n: I18nProvider,
    private readonly configProvider: ConfigProvider,
    private readonly usersPersistence: UsersPersistence,
    private readonly emailProvider: EmailProvider,
    private readonly storageProvider: StorageProvider,
    private readonly datasource: DataSource,
    private readonly slackProvider: SlackProvider,
  ) {
  }

  get code(): string {
    return 'SUS' // Service - USers
  }

  static ERROR_CODES = {
    /** user IDの検証エラー */
    INVALID_ID_USER:           ErrorInfo.getBuilder(  'IID', 'invalid_user_id'),
    /** メールアドレスの形式に異常 */
    INVALID_EMAIL:             ErrorInfo.getBuilder( 'IEML', 'invalid_email'),
    /** メールで送られた検証コードに異常 */
    INVALID_VERIFICATION_CODE: ErrorInfo.getBuilder(  'IVC', 'invalid_verification_code'),
    /** メールアドレスかパスワードが間違っている */
    INVALID_EMAIL_OR_PASSWORD: ErrorInfo.getBuilder( 'IVEP', 'invalid_email_or_password'),
    /** 既にアカウントが存在 */
    USER_ALREADY_IN_USE:       ErrorInfo.getBuilder(  'AIU', 'already_in_use'),
    /** 不明な理由によりユーザが作れなかった場合 */
    FAILED_TO_CREATE_ACCOUNT:  ErrorInfo.getBuilder(  'FCA', 'failed_to_create_account'),

    USER_ALREADY_IN_RECESS:  ErrorInfo.getBuilder(  'AIRC', 'the_user_is_already_in_recess'),
  }

  get errorCodes() {
    return UsersService.ERROR_CODES
  }

  /**
   * Adminユーザかチェックする。
   * @param userId
   * @returns
   */
  async isAccessibleByAdmin(
    userId: string,
  ): Promise<boolean> {
    return await this.datasource.manager.transaction(async (t) => {
      const user = await t.findOneBy(User, { id: userId, is_deleted: false, is_admin: true })
      if (!user) {
        return false
      }
      // 存在していれば権限あり
      return true
    })
  }

  private async createOrUpdateFirebaseUser(
    t: EntityManager,
    email: string,
    password: string,
    opts: {
      setEmailVerified: boolean,
      userId: string | null,
    } = {
      setEmailVerified: false,
      userId: null,
    }): Promise<UserRecord> {

    let userRec: UserRecord | null = null
    // 対象の存在チェック
    try {
      userRec = await this.firebase.auth.getUserByEmail(email)
    } catch (e) {
      const code: string = e.code
      if (code == 'auth/user-not-found') {
        // do nothing
      } else {
        this.logger.error(e)
      }
    }

    if (userRec && !await t.getRepository(User).findOneBy({ email })) {
      // firebase側で既に存在するのにも関わらず、レコードとしてユーザが存在しなかった場合
      // この場合は明確な整合性エラーなため、元々のユーザを消す。
      // （Google Signinの周りで勝手にアカウントを作られてしまった場合などにあり得る）
      await this.firebase.auth.deleteUser(userRec.uid)
      userRec = null
    }

    // すでに確認が取れている場合についてはアカウントの作成/更新を防止
    if (userRec?.emailVerified) {
      this.logger.log('Already verified')
      throw new CodedUnauthorizedException(this.code, this.errorCodes.USER_ALREADY_IN_USE('CNU-003'))
    }

    try {
      // ユーザがあるものの確認が取れていない場合には別の人物が勝手に作った場合などを考慮し、
      // それ以外の場合には作成する。
      if (userRec) {
        this.logger.log(`update: ${userRec.uid}`)
        await this.firebase.auth.updateUser(userRec.uid, {
          password: password,
          emailVerified: opts.setEmailVerified || userRec.emailVerified,
        })
      } else {
        this.logger.log(`create new user: ${email}`)
        userRec = await this.firebase.auth.createUser({
          ...(opts.userId ? {uid: opts.userId} : {}),
          email: email,
          password: password,
          emailVerified: opts.setEmailVerified,
        })
      }
    } catch (e) {
      // https://firebase.google.com/docs/auth/admin/errors
      const code: string = e.code
      if (code == 'auth/email-already-exists') {
        // メールの存在を相手に知られてしまうが、今回についてはそれよりはエラー対応を重視した方が良いと思われるため、
        // ここで個別のコードを割り振っておく。
        throw new CodedUnauthorizedException(this.code, this.errorCodes.USER_ALREADY_IN_USE('CNU-001'))
      } else if (code == 'auth/invalid-email') {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL('CNU-002'))
      } else {
        this.logger.error(e)
        throw new CodedUnauthorizedException(this.code, this.errorCodes.FAILED_TO_CREATE_ACCOUNT('CNU-004'))
      }
    }
    return userRec
  }

  /**
   */
  async createNewUser(data: {
    email: string,
    password: string,
    user_id?: string | null
  }) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const userRec = await this.createOrUpdateFirebaseUser(t, data.email, data.password, {
        setEmailVerified: false,
        userId: data.user_id ?? null
      })
      const uid = userRec.uid
      this.logger.debug(`user: ${uid}`)


      const now = new Date()
      const userData = {
        id: uid,
        email: data.email ?? null,
        created_at: now,
        updated_at: now,
      }
      const profileData = {
        user_id: uid,
        created_at: now,
        updated_at: now,
      }
      const user = await t.getRepository(User).findOneBy({ id: uid, is_deleted: false })
      if (user) {
        await t.update(User, { id: uid }, userData)
      } else {
        await t.save(User, userData)
      }
      const userProfile = await t.getRepository(UserProfile).findOneBy({ user_id: uid })
      if (userProfile) {
        await t.update(UserProfile, { user_id: uid }, profileData)
      } else {
        await t.save(UserProfile, profileData)
      }

      this.logger.debug('Sending email...')

      await this.emailProvider.sendSignupEmail(
        await this.i18n.t('_.email_verification'),
        data.email,
        {
          app: 'MPPLATFORM',
        }
      )

      return _.first(await this.usersPersistence.getUsers(t, [uid]))
    })
    return {
      user: tranResult,
    }
  }

  async getUser(id: string) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const user = _.first(await this.usersPersistence.getUsers(t, [id], {
      }))
      if (!user) {
        await this.usersPersistence.deleteUserIfItDoesNotExistInDatabase(t, id)
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GU-001'))
      }
      return user
    })
    return {
      user: tranResult,
    }
  }

  async updateUser(id: string, data) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const user = await t.findOneBy(User, { id, is_deleted: false, })
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('UUSR-001'))
      }

      const userProfile = await t.findOneBy(UserProfile, { user_id: id, })

      const now = new Date()
      const acceptableKeys = _.chain([
        'name_sei',
        'name_mei',
        'kana_name_sei',
        'kana_name_mei',
        'gender',
        'birthday',
      ])
        .invert()
        .mapValues(() => true)
        .value()

      const partialData = {
        updated_at: now,
      }
      _.chain(data)
        .keys()
        .filter(x => acceptableKeys[x])
        .each((dataKey) => {
          const dbKey = (dataKey == 'gender') ? 'gender_type' : dataKey
          partialData[dbKey] = data[dataKey]
        }).commit()

      if (userProfile) {
        await t.update(UserProfile, { user_id: id }, partialData)
      } else {
        await t.save(UserProfile, {
          user_id: id,
          created_at: now,
          ...partialData,
        })
      }
      return _.first(await this.usersPersistence.getUsers(t, [id], {
      }))
    })
    return {
      user: tranResult,
    }
  }

  async verifyToUpdateEmail(id: string, data: { email: string }) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const user = await t.findOneBy(User, { id, is_deleted: false, })
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('VUE-001'))
      }
      const userProfile = await t.findOneBy(UserProfile, { user_id: user.id })

      const vCode = uuidv4()

      await this.firebase.auth.setCustomUserClaims(id, {
        verification_code: vCode,
      })

      await this.emailProvider.sendUpdateEmail(
        await this.i18n.t('_.email_change_verification'),
        data.email,
        {
          id,
          app: 'MPPLATFORM',
          name: userProfile.getDispNameForEmailOrNotification(user),
          email: data.email,
          verificationCode: vCode
        }
      )

      return _.first(await this.usersPersistence.getUsers(t, [id]))
    })
    return {
      user: tranResult,
    }
  }

  async updateEmail(id: string, email: string, verificationCode: string) {
    await this.datasource.manager.transaction(async (t) => {
      const fireUser = await this.firebase.auth.getUser(id)
      this.logger.debug(`${fireUser.customClaims?.verification_code} vs ${verificationCode}`)
      if (fireUser.customClaims?.verification_code != verificationCode) {
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_VERIFICATION_CODE('UE-001'))
      }
      const user = await t.findOneBy(User, { id, is_deleted: false, })
      user.email = email
      await t.save(user)
      await this.firebase.auth.updateUser(id, {
        email
      })
      await this.firebase.auth.setCustomUserClaims(id, {
        verification_code: null,
      })
    })
  }

  async updatePassword(id: string, data: { current_password: string, password: string }) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const fireUser = await this.firebase.auth.getUser(id)
      const auth = getAuthClient(this.firebase.firebaseAppClient)
      try {
        await signInWithEmailAndPassword(auth, fireUser.email, data.current_password)
      } catch (e) {
        this.logger.debug(e)
        throw new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_EMAIL_OR_PASSWORD('UP-001'))
      }
      await this.firebase.auth.updateUser(id, {
        password: data.password,
      })

      return _.first(await this.usersPersistence.getUsers(t, [id]))
    })
    return {
      user: tranResult,
    }
  }

  async sendPasswordResetEmail(email: string) {
    await this.datasource.manager.transaction(async (t) => {
      let fireUser = null
      try {
        fireUser = await this.firebase.auth.getUserByEmail(email)
      } catch (e) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_EMAIL('SPR-001'))
      }

      const user = await t.findOneBy(User, { id: fireUser.uid, is_deleted: false, })
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_EMAIL('SPR-002'))
      }

      const vCode = uuidv4()

      await this.firebase.auth.setCustomUserClaims(fireUser.uid, {
        verification_code: vCode,
      })

      await this.emailProvider.sendPasswordResetEmail(
        await this.i18n.t('_.password_reset'),
        email
      )
    })
    return {}
  }

  /**
   * 論理削除
   */
  async deleteUser(id: string) {
    await this.datasource.manager.transaction(async (t) => {
      const user = await t.findOneBy(User, { id, is_deleted: false, })
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('DUS-001'))
      }
      user.is_deleted = true
      await t.save(user)
    })
  }

  /***
   * 一般でなく各種細かい情報の入った詳細取得。admin-console向け。
   */
  async getUserDetails(id: string, maxNumberOfSigninHistories = 10) {
    const tranResult = await this.datasource.manager.transaction(async (t) => {
      const users = await this.usersPersistence.getUsers(t, [id], {
        maxNumberOfSigninHistories: maxNumberOfSigninHistories,
      })
      const user = _.first(users)
      if (!user) {
        throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GUD-001'))
      }
      let fireUser = null
      try {
        fireUser = await this.firebase.auth.getUser(id)
      } catch (e) {
        const code: string = e.code
        if (code == 'auth/user-not-found') {
          throw new CodedInvalidArgumentException(this.code, this.errorCodes.INVALID_ID_USER('GUD-002'))
        } else {
          this.logger.error(e)
        }
      }
      return user
    })
    return {
      user: tranResult,
    }
  }
}
