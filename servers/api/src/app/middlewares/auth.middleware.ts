import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import jwt from 'jsonwebtoken'
import _ from 'lodash'

// import { ServerResponse } from 'http'
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { FirebaseInfo } from '@/app/modules/firebase.module'
import { AuthProvider } from '@/app/providers/auth.provider'
import { ConfigProvider } from '@/app/providers/config.provider'
import { Coded } from '@/app/utils/coded'

/***
 * Firebaseへのユーザ認証を行う。
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware, Coded {
  private readonly logger = new Logger(AuthMiddleware.name)
  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly authProvider: AuthProvider,
    private readonly configProvider: ConfigProvider
  ) {
    //
  }

  get code(): string {
    return 'MAT'
  }

  static ERROR_CODES = {
    NO_TOKEN:      ErrorInfo.getBuilder( 'NT', 'no_token'),
    INVALID_TOKEN: ErrorInfo.getBuilder('IVT', 'invalid_token'),
    EXPIRED_TOKEN: ErrorInfo.getBuilder('EXT', 'token_error'),
  }

  get errorCodes() {
    return AuthMiddleware.ERROR_CODES
  }

  use(req, res, next: () => void) {
    this._use(req, res, next)
  }

  async _use(req, res, next: (error?: Error) => void) {
    this.logger.debug(`M:[${req.method}] P:${req.originalUrl}`)
    const config = this.configProvider.config
    const accessToken: string = _.get(req.cookies, config.cookieAccessTokenName) ?? req.headers?.authorization?.replace(/^Bearer\s+/, '')
    const refreshToken: string = _.get(req.cookies, config.cookieRefreshTokenName)
    // このMiddlewareにおいて、tokenが与えられていなかった場合は不可。
    if (!accessToken) {
      return next(new CodedUnauthorizedException(this.code, this.errorCodes.NO_TOKEN('U-001')))
    }
    // accessTokenの検証
    try {
      const decoded = await this.firebase.auth.verifyIdToken(accessToken)
      // throw {errorInfo: {code: 'auth/id-token-expired'}} // test
      req.uid = decoded.uid
    } catch (e) {
      // accessTokenに異常があった場合（壊れている/期限切れ/その他）
      /**
       * LOCAL用（accessTokenの検証失敗時）
       * エミュレータ起動の場合はrefreshTokenを使った更新ができないので無理やり通す。
       */
      if (this.configProvider.config.isEmulatorMode) {
        this.logger.verbose('+++ using expired token for emulators +++')
        const decoded = await jwt.decode(accessToken)
        if (!decoded) {
          return next(new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_TOKEN('U-006')))
        }
        req.uid = _.get(decoded, 'user_id') // こちらの場合はuidは存在しないのでuser_idでとる。
        return next()
      }
      /**
       * 以下LOCAL以外（accessTokenの検証失敗時）
       * refreshTokenを用いて両トークンを更新する必要がある。
       * Front側でSDKによってトークンが管理されている場合は勝手にFront側でrefreshされていると思われるが、
       * SDKを用いない場合などはhttp-only-cookieでの自動更新のために以下の処理が必須となる。
       */
      if (!refreshToken) { // そもそもrefreshTokenが与えられていなかった場合は更新不能
        return next(new CodedUnauthorizedException(this.code, this.errorCodes.EXPIRED_TOKEN('U-005')))
      }
      // accessTokenに対する例外の種類によって処理を分ける。
      const code: string = e.errorInfo?.code
      if (code == 'auth/id-token-expired') {
        // accessTokenが期限切れの場合
        try {
          const data = await this.authProvider.refreshToken(refreshToken)
          await this.authProvider.setTokenToCookie(res, data.id_token, data.refresh_token, false)
          this.logger.debug('+++ token refreshed +++')
          req.uid = data.user_id
        } catch (e) {
          return next(new CodedUnauthorizedException(this.code, this.errorCodes.EXPIRED_TOKEN('U-004')))
        }
      } else if (code == 'auth/argument-error') {
        // accessTokenトークンが壊れていた場合など
        return next(new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_TOKEN('U-002')))
      } else {
        // auth/id-token-revoked など（トークン破棄）
        return next(new CodedUnauthorizedException(this.code, this.errorCodes.INVALID_TOKEN('U-003')))
      }
    }
    next()
  }
}
