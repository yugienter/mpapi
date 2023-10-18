import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import _ from 'lodash';
// import _ from 'lodash'
import moment from 'moment';

export declare class Config {
  /** Environment variable: APP_ENV */
  readonly appEnv: string;
  /** Environment variable: APP_SECRET_KEY */
  readonly appSecretKey: string;
  /** Environment variable: SERVER_PORT */
  readonly serverPort: string;
  /** Environment variable: APP_BASE_URL */
  readonly appBaseUrl: string;
  /** Environment variable: EXCHANGE_BASE_URL */
  readonly exchangeBaseUrl: string;

  /** Environment variable: LOG_LEVEL */
  readonly logLevel: LogLevel;
  /** Environment variable: LOG_FILE */
  readonly logFile: string;

  /** Environment variable: AWS_ACCESS_KEY */
  readonly awsAccessKey: string;
  /** Environment variable: AWS_SECRET_KEY */
  readonly awsSecretKey: string;
  /** Environment variable: AWS_REGION */
  readonly awsRegion: string;

  /** Environment variable: EMAIL_USER */
  readonly emailUser: string;
  /** Environment variable: BCC_EMAIL_USER */
  readonly bccEmailUser: string;
  /** Environment variable: AWS_EMAIL_USER */
  readonly awsEmailUser: string;
  /** Environment variable: EMAIL_PASSWORD */
  readonly emailPassword: string;
  /** Environment variable: EMAIL_HOST */
  readonly emailHost: string;
  /** Environment variable: EMAIL_PORT */
  readonly emailPort: string;
  /** Environment variable: EMAIL_DEBUG_PREVIEW */
  readonly emailDebugPreview: boolean;
  /** Environment variable: EMAIL_SES_TRACKING */
  readonly emailSESTracking: string;

  readonly slackApiHost: string;
  /**
   * https://api.slack.com/apps/
   */
  readonly slackAuthToken: string;

  readonly dbHost: string;
  readonly dbPort: number;
  readonly dbDatabase: string;
  readonly dbUsername: string;
  readonly dbPassword: string;

  readonly cookieAccessTokenName: string;
  readonly cookieRefreshTokenName: string;

  /** Environment variable: IS_EMULATOR_MODE */
  readonly isEmulatorMode: boolean;
  /** Environment variable: IS_RESTRICTED_SERVER */
  readonly isRestrictedServer: boolean;

  /**
   * Environment variable: FIREBASE_AUTH_EMULATOR_HOST
   * - Link: https://firebase.google.com/docs/emulator-suite/connect_auth#admin_sdks
   */
  readonly firebaseAuthEmulatorHost: string;
  /**
   * Environment variable: FIRESTORE_EMULATOR_HOST
   * - Link: https://firebase.google.com/docs/emulator-suite/connect_firestore#admin_sdks
   */
  readonly firestoreEmulatorHost: string;
  /**
   * Environment variable: FIREBASE_STORAGE_EMULATOR_HOST
   * - Link: https://firebase.google.com/docs/emulator-suite/connect_storage#admin_sdks
   */
  readonly firebaseStorageEmulatorHost: string;

  /** Environment variable: FIREBASE_PROJECT_ID */
  readonly firebaseProjectId: string;
  /** Environment variable: FIREBASE_DATABASE */
  readonly firebaseDatabase: string;
  /** Environment variable: FIREBASE_WEB_API_KEY */
  readonly firebaseWebApiKey: string;

  /** Environment variable: SETCOOKIE_DOMAIN */
  readonly setCookieDomain: string;

  /** Environment variable: SERVER_COMMUNICATION_SALT */
  readonly serverCommunicationSalt: string;

  /** Environment variable: APP_LAST_UPDATE_DATETIME */
  readonly appLastUpdateDatetime: Date;

  readonly hashIdsSalt: string;
}

@Injectable()
export class ConfigProvider {
  private readonly logger = new Logger(ConfigProvider.name);

  private _config: Config = null;

  constructor(private readonly configService: ConfigService) {
    const dt = this.configService.get<string>('APP_LAST_UPDATE_DATETIME');
    this._config = {
      appEnv: this.getOrShowError<string>('APP_ENV'),
      appSecretKey: this.getOrShowError<string>('APP_SECRET_KEY'),
      serverPort: this.getOrShowError<string>('SERVER_PORT'),
      appBaseUrl: this.getOrShowError<string>('APP_BASE_URL'),
      exchangeBaseUrl: this.getOrShowError<string>('EXCHANGE_BASE_URL'),

      logLevel: this.getOrShowError<LogLevel>('LOG_LEVEL', 'log'),
      logFile: this.getOrShowError<string>('LOG_FILE', null),

      awsAccessKey: this.getOrShowError<string>('AWS_ACCESS_KEY', null),
      awsSecretKey: this.getOrShowError<string>('AWS_SECRET_KEY', null),
      awsRegion: this.getOrShowError<string>('AWS_REGION', null),

      emailUser: this.getOrShowError<string>('EMAIL_USER', null),
      bccEmailUser: this.getOrShowError<string>('BCC_EMAIL_USER', null),
      awsEmailUser: this.getOrShowError<string>('AWS_EMAIL_USER', null),
      emailPassword: this.getOrShowError<string>('EMAIL_PASSWORD', null),
      emailHost: this.getOrShowError<string>('EMAIL_HOST', null),
      emailPort: this.getOrShowError<string>('EMAIL_PORT', null),
      emailDebugPreview: this.getOrShowError<string>('EMAIL_DEBUG_PREVIEW', '0') == '1',
      emailSESTracking: this.getOrShowError<string>('EMAIL_SES_TRACKING', null),

      slackApiHost: this.getOrShowError<string>('SLACK_API_HOST', null),
      slackAuthToken: this.getOrShowError<string>('SLACK_AUTH_TOKEN', null),

      dbHost: this.getOrShowError<string>('DB_HOST', null),
      dbPort: this.getOrShowError<number>('DB_PORT', null),
      dbDatabase: this.getOrShowError<string>('DB_DATABASE', null),
      dbUsername: this.getOrShowError<string>('DB_USERNAME', null),
      dbPassword: this.getOrShowError<string>('DB_PASSWORD', null),

      cookieAccessTokenName: this.getOrShowError<string>('COOKIE_ACCESS_TOKEN_NAME', null),
      cookieRefreshTokenName: this.getOrShowError<string>('COOKIE_REFRESH_TOKEN_NAME', null),

      isEmulatorMode: this.getOrShowError<string>('IS_EMULATOR_MODE', '0') == '1',
      isRestrictedServer: this.getOrShowError<string>('IS_RESTRICTED_SERVER', '0') == '1',

      firebaseAuthEmulatorHost: this.getOrShowError<string>('FIREBASE_AUTH_EMULATOR_HOST', null),
      firestoreEmulatorHost: this.getOrShowError<string>('FIRESTORE_EMULATOR_HOST', null),
      firebaseStorageEmulatorHost: this.getOrShowError<string>('FIREBASE_STORAGE_EMULATOR_HOST', null),

      firebaseProjectId: this.getOrShowError<string>('FIREBASE_PROJECT_ID'),
      firebaseDatabase: this.getOrShowError<string>('FIREBASE_DATABASE', null),
      firebaseWebApiKey: this.getOrShowError<string>('FIREBASE_WEB_API_KEY'),

      setCookieDomain: this.getOrShowError<string>('SETCOOKIE_DOMAIN'),

      serverCommunicationSalt: this.getOrShowError<string>('SERVER_COMMUNICATION_SALT', ''),

      appLastUpdateDatetime: dt ? moment(dt).toDate() : new Date(),

      hashIdsSalt: this.getOrShowError<string>('HASH_IDS_SALT'),
    };
  }

  get config() {
    return this._config;
  }

  private getOrShowError<T>(key, defaultValue = undefined, castFunction: (v: T) => T = null) {
    const val = this.configService.get<T>(key);
    if (val) {
      if (castFunction) {
        return castFunction(val);
      }
      return val;
    } else if (defaultValue !== undefined) {
      return defaultValue;
    }
    this.logger.error(`Insufficient environment value for key: ${key}. Check your .env`);
    return null;
  }
}
