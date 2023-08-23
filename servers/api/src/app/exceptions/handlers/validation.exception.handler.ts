import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import _ from 'lodash';

import { ValidationException } from '@/app/exceptions/errors/validation.exception';
import { I18nProvider } from '@/app/providers/i18n.provider';
import { ValidationUtil } from '@/app/utils/validation.util';

/***
 * https://docs.nestjs.com/exception-filters
 */
@Catch(ValidationException)
export class ValidationExceptionHandler implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionHandler.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly i18n: I18nProvider) {
    // nothing to do
  }

  // catch(exception: ValidationException, host: ArgumentsHost) {
  //   this._catch(exception, host)
  // }

  catch(exception: ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const { httpAdapter } = this.httpAdapterHost;

    const lang = request.headers['accept-language'] ?? request.headers['content-language'];

    this.logger.verbose(`422 Error: ${exception.message}`);

    const modifiedErrors = [];
    // validationで発生したエラー内容を整形する。
    // requiredの場合は対象が params.missingProperty に入る点に注意する。
    for (const error of exception.errors) {
      const dottedInstancePath = _.trim(error.instancePath, '/').split('/').join('.');
      const validationInfo =
        error.keyword == 'required'
          ? {
              param: error.params.missingProperty,
              type: error.keyword,
              values: error.params,
              message: error.message,
            }
          : {
              param: dottedInstancePath,
              type: error.keyword,
              values: error.params,
              message: error.message,
            };
      modifiedErrors.push({
        ...validationInfo,
        translated: ValidationUtil.getTranslatedMessage(this.i18n, lang, validationInfo),
      });
    }

    httpAdapter.reply(
      ctx.getResponse(),
      {
        message: 'unprocessable_entity',
        translated: this.i18n.translate('errors.invalid_arguments', { lang }),
        code: null,
        errors: modifiedErrors,
      },
      status,
    );
  }
}
