/**
 * Controller, Service, Handler(Filter)などの定義を行う。
 */
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from '@/app/controllers/admin/admin.controller';
import { AuthController } from '@/app/controllers/auth.controller';
import { CompaniesController } from '@/app/controllers/companies/companies.controller';
import { FilesController } from '@/app/controllers/files/files.controller';
import { HealthController } from '@/app/controllers/health.controller';
import { InvestorController } from '@/app/controllers/investor/investor.controller';
import { MastersController } from '@/app/controllers/masters.controller';
import { PublicController } from '@/app/controllers/public.controller';
import { SamplesController } from '@/app/controllers/samples.controller';
import { UsersController } from '@/app/controllers/users/users.controller';
import { CodedExceptionHandler } from '@/app/exceptions/handlers/coded.handlers';
import { ExceptionHandler } from '@/app/exceptions/handlers/handler';
import { ValidationExceptionFilter } from '@/app/exceptions/handlers/validation.filter';
import { AuthMiddleware } from '@/app/middlewares/auth.middleware';
import { CorsMiddleware } from '@/app/middlewares/cors.middleware';
import { ALL_MODELS } from '@/app/models/index';
import { AuthProvider } from '@/app/providers/auth.provider';
import { ConfigProvider } from '@/app/providers/config.provider';
import { DataAccessProvider } from '@/app/providers/data-access.provider';
import { EmailProvider } from '@/app/providers/email.provider';
import { I18nProvider } from '@/app/providers/i18n.provider';
import { S3Provider } from '@/app/providers/s3.provider';
import { SlackProvider } from '@/app/providers/slack.provider';
import { StorageProvider } from '@/app/providers/storage.provider';
import { authorizedControllers, mpplatformPersistences, mpplatformServices } from '@/app/utils/decorators';

// ここの並び順はSwagger的に若干重要
const allControllers = [
  SamplesController,
  PublicController,
  HealthController,
  AuthController,
  UsersController,
  CompaniesController,
  FilesController,
  AdminController,
  MastersController,
  InvestorController,
];

const publicControllers = [AuthController, SamplesController, PublicController, InvestorController];

const providers = [
  AuthProvider,
  DataAccessProvider,
  ConfigProvider,
  EmailProvider,
  StorageProvider,
  I18nProvider,
  SlackProvider,
  S3Provider,
];

const services = [...mpplatformServices, ...mpplatformPersistences, ...providers];

@Module({
  controllers: allControllers, // ここの並び順はSwaggerにも影響する
  imports: [HttpModule, TypeOrmModule.forFeature(ALL_MODELS)],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionHandler, // 他の例外を全て捕捉するこいつを必ず最初に置く
    },
    {
      provide: APP_FILTER,
      useClass: CodedExceptionHandler,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    // change the validation filter from ajv to class-validator
    // {
    //   provide: APP_FILTER,
    //   useClass: ValidationExceptionHandler,
    // },
    ...services,
  ],
})
export class ApiModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes(...publicControllers, ...authorizedControllers);
    // 認証(AuthMiddleware)が必要なものを記述
    consumer.apply(AuthMiddleware).forRoutes(...authorizedControllers);
  }
}
