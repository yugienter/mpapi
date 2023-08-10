import { BigQuery } from '@google-cloud/bigquery';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { FirebaseApp as FirebaseAppClient, initializeApp as initializeAppClient } from 'firebase/app';
import { connectAuthEmulator, getAuth as getAuthClient } from 'firebase/auth';
import { App as FirebaseAppAdmin, applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { Auth as AuthAdmin, getAuth as getAuthAdmin } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getStorage, Storage } from 'firebase-admin/storage';

import { ConfigProvider } from '@/app/providers/config.provider';

export class FirebaseInfo {
  constructor(
    readonly firebaseAppAdmin: FirebaseAppAdmin,
    readonly firebaseAppClient: FirebaseAppClient,
    readonly auth: AuthAdmin,
    readonly db: Firestore,
    readonly storage: Storage,
    readonly messaging: Messaging,
    readonly bigQueryClient: BigQuery,
  ) {
    //
  }
}

// https://docs.nestjs.com/modules
@Module({
  providers: [ConfigProvider],
})
export class FirebaseModule {
  private static readonly logger = new Logger(FirebaseModule.name);

  static forRoot(): DynamicModule {
    // https://docs.nestjs.com/fundamentals/custom-providers
    const dbProvider = {
      provide: FirebaseInfo,
      useFactory: (configProvider: ConfigProvider) => {
        const isEmulatorMode = configProvider.config.isEmulatorMode;
        const projectId = configProvider.config.firebaseProjectId;
        let db: Firestore;
        let storage: Storage;
        let authAdmin: AuthAdmin;
        let messaging: Messaging;
        let firebaseAppAdmin: FirebaseAppAdmin;
        let firebaseAppClient: FirebaseAppClient;

        if (isEmulatorMode) {
          this.logger.log('+++++ EMULATOR MODE +++++');
          const firebaseAppAdmin = initializeApp({
            projectId: projectId,
          });
          // firebase-adminなら以下のような設定はやらなくていいっぽい
          // connectFirestoreEmulator(
          //   db,
          //   configProvider.config.firestoreHost,
          //   configProvider.config.firestorePort
          // )

          // Firebase Firestore
          db = getFirestore(firebaseAppAdmin);
          storage = getStorage(firebaseAppAdmin);
          // Firebase Authentication の Admin SDK
          authAdmin = getAuthAdmin(firebaseAppAdmin);
          // Firebase Cloud Messaging
          messaging = getMessaging(firebaseAppAdmin);

          // Firebase Authentication の Client
          firebaseAppClient = initializeAppClient({
            projectId,
            apiKey: 'foobar', // なんでもいいっぽい
          });
          connectAuthEmulator(
            getAuthClient(firebaseAppClient),
            `http://${configProvider.config.firebaseAuthEmulatorHost}`,
          );
        } else {
          // firebase-adminの方はこれらの環境変数も参照するので空にしておく必要がある（.envでやっているかもしれないが念の為）。
          process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '';
          process.env['FIRESTORE_EMULATOR_HOST'] = '';
          process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = '';
          const firebaseAppAdmin = initializeApp({
            // applicationDefault() では環境変数 GOOGLE_APPLICATION_CREDENTIALS でAdminSDKのサービスアカウントのJSONファイルのパスが必要
            // credential: applicationDefault(),
            credential: cert({
              // cert()の中に直接JSON形式で代入
              projectId: projectId,
              privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            }),
          });
          // Firebase Firestore
          db = getFirestore(firebaseAppAdmin);
          storage = getStorage(firebaseAppAdmin);
          // Firebase Authentication の Admin SDK
          authAdmin = getAuthAdmin(firebaseAppAdmin);
          // Firebase Cloud Messaging
          messaging = getMessaging(firebaseAppAdmin);
          // Firebase Authentication の Client
          firebaseAppClient = initializeAppClient({
            projectId,
            apiKey: configProvider.config.firebaseWebApiKey,
          });
        }

        const bigqueryClient = new BigQuery();
        return new FirebaseInfo(firebaseAppAdmin, firebaseAppClient, authAdmin, db, storage, messaging, bigqueryClient);
      },
      inject: [ConfigProvider],
    };
    return {
      global: true,
      module: FirebaseModule,
      imports: [],
      providers: [dbProvider],
      exports: [dbProvider],
    };
  }
}
