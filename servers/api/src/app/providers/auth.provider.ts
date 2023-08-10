import { CookieSerializeOptions } from '@fastify/cookie';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import Hashids from 'hashids';
import _ from 'lodash';
import moment from 'moment';
import { firstValueFrom } from 'rxjs';

import { ConfigProvider } from '@/app/providers/config.provider';
import { HashIdsHandler } from '@/app/utils/hash-ids-handler';
import { CONSTANTS } from '@/config/constants';

@Injectable()
export class AuthProvider {
  private readonly logger = new Logger(AuthProvider.name);

  private readonly hashIds = new Hashids(this.configProvider.config.hashIdsSalt, CONSTANTS.hashIdsPadLength);
  constructor(private readonly httpService: HttpService, private readonly configProvider: ConfigProvider) {
    // nothing to do
  }

  getHashIdsHandler(): HashIdsHandler {
    return new HashIdsHandler(this.hashIds);
  }

  async setTokenToCookie(response, accessToken, refreshToken, isFastifyResponse = true) {
    const config = this.configProvider.config;
    const cookieOpt: CookieSerializeOptions = {
      expires: moment(new Date()).add(100, 'years').toDate(), // JWT側が期限を担保するのでCookieの方は長めに取っておく。
      path: '/',
      domain:
        config.appEnv == 'production' || config.appEnv == 'stg' || config.appEnv == 'dev'
          ? this.configProvider.config.setCookieDomain
          : null,
      secure: config.appEnv == 'production' || config.appEnv == 'stg' || config.appEnv == 'dev',
      httpOnly: true,
      sameSite: 'lax',
    };
    if (isFastifyResponse) {
      // https://github.com/fastify/fastify-cookie/blob/master/plugin.d.ts#L87
      response.setCookie(config.cookieAccessTokenName, accessToken ?? '', cookieOpt);
      response.setCookie(config.cookieRefreshTokenName, refreshToken ?? '', cookieOpt);
    } else {
      // middleware上で得られるレスポンスの場合はFastifyReplyではないらしく、この対応が必要。
      const optStr = _.map(cookieOpt, (v, k) => `${k}=${v}`).join('; ');
      response.setHeader('set-cookie', [
        config.cookieAccessTokenName + '=' + (accessToken ?? '') + '; ' + optStr,
        config.cookieRefreshTokenName + '=' + (refreshToken ?? '') + '; ' + optStr,
      ]);
    }
  }

  /***
   * JWTのRefresh-Token実装。SDKを介さない場合にTokenの期限切れが発生した場合に、Refresh-Tokenを利用して認証サーバ上で再認証を行う。
   */
  async refreshToken(refreshToken: string): Promise<{ id_token: string; refresh_token: string; user_id: string }> {
    const key = this.configProvider.config.firebaseWebApiKey;
    const searchParams = new URLSearchParams();
    searchParams.append('grant_type', 'refresh_token');
    searchParams.append('refresh_token', refreshToken);
    const result = await firstValueFrom(
      this.httpService.post(`https://securetoken.googleapis.com/v1/token?key=${key}`, searchParams, {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
      }),
    );
    if (_.get(result, 'response.error')) {
      throw new Error('failed to refresh token');
    }
    const data = result.data;
    return {
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id,
    };
  }

  /**
   *
   * @param token 通信用トークン（sha256のhmacでハッシュ化されたペイロード）
   * @param payload 送信されてきたペイロード
   * @returns 検証結果がokかどうか
   */
  async checkServerAuthToken(
    token: string,
    payload: string,
  ): Promise<{
    isOk: boolean;
    calculated: string;
  }> {
    const hmac = createHmac('sha256', this.configProvider.config.serverCommunicationSalt);
    const hashed = hmac.update(payload).digest('hex');
    this.logger.verbose(`Raw body: ${payload}`);
    this.logger.verbose(`Hashed: ${hashed} / Given: ${token}`);
    return {
      isOk: hashed == token,
      calculated: hashed,
    };
  }
}
