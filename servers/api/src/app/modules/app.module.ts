/**
 * アプリのコアの部分。主要なモジュールのimportインポートを行う。
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import AWS from 'aws-sdk';
import path from 'path';

import { ALL_MODELS } from '@/app/models/index';
import { ApiModule } from '@/app/modules/api.module';
import { ApiBaseModule } from '@/app/modules/api-base.module';
import { ConfigProviderModule } from '@/app/modules/config.provider.module';
import { FirebaseModule } from '@/app/modules/firebase.module';
import { LoggerModule } from '@/app/modules/logger.module';
import { AuthProvider } from '@/app/providers/auth.provider';
import { ConfigProvider } from '@/app/providers/config.provider';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    RouterModule.register([
      {
        path: 'api',
        module: ApiModule,
      },
      {
        path: '',
        module: ApiBaseModule,
      },
    ]),
    ApiBaseModule,
    ApiModule,
    FirebaseModule.forRoot(),
    LoggerModule.forRoot(),
    ConfigProviderModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigProviderModule],
      inject: [ConfigProvider],
      useFactory: (configProvider: ConfigProvider) => {
        const conf = configProvider.config;
        return {
          transport: {
            SES: new AWS.SES({
              region: conf.awsRegion,
              accessKeyId: conf.awsAccessKey,
              secretAccessKey: conf.awsSecretKey,
            }),
            host: conf.emailHost,
            port: conf.emailPort,
            secure: true,
            ignoreTLS: false,
            auth: {
              user: conf.awsEmailUser,
              pass: conf.emailPassword,
            },
          },
          defaults: {
            from: `"日本カーボンクレジット取引所" <${conf.emailUser}>`,
          },
          preview: conf.emailDebugPreview,
          template: {
            dir: path.join(__dirname, '../../resources', 'email/templates'),
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigProviderModule],
      inject: [ConfigProvider],
      useFactory: (configProvider: ConfigProvider) => {
        const conf = configProvider.config;
        return {
          type: 'mysql',
          timezone: '+00:00',
          host: conf.dbHost,
          port: conf.dbPort,
          username: conf.dbUsername,
          password: conf.dbPassword,
          database: conf.dbDatabase,
          entities: ALL_MODELS,
          synchronize: false,
        };
      },
    }),
  ],
  controllers: [],
  providers: [AuthProvider, ConfigProvider],
  exports: [],
})
export class AppModule {}
