/**
 */
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'

import { BaseUrlController } from '@/app/controllers/base-url.controller'
import { CodedExceptionHandler } from '@/app/exceptions/handlers/coded.handlers'
import { ExceptionHandler } from '@/app/exceptions/handlers/handler'
import { ValidationExceptionHandler } from '@/app/exceptions/handlers/validation.exception.handler'
import { ConfigProvider } from '@/app/providers/config.provider'
import { I18nProvider } from '@/app/providers/i18n.provider'

@Module({
  controllers: [ // ここの並び順はSwaggerにも影響する
    BaseUrlController,
  ],
  imports: [HttpModule],
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
      useClass: ValidationExceptionHandler,
    },
    ConfigProvider,
    I18nProvider,
  ],
})
export class ApiBaseModule { }
