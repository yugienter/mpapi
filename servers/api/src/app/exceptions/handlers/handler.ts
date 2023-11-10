import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import _ from 'lodash';
import { TypeORMError } from 'typeorm';

import { ConfigProvider } from '@/app/providers/config.provider';
import { I18nProvider } from '@/app/providers/i18n.provider';

const errorCodesToIgnore = _.chain([
  'ECONNRESET',
  'ERR_STREAM_PREMATURE_CLOSE',
  'FST_ERR_CTP_INVALID_MEDIA_TYPE',
  'FST_ERR_CTP_BODY_TOO_LARGE',
])
  .invert()
  .mapValues(() => true)
  .value();

@Catch(Error, TypeORMError)
export class ExceptionHandler implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionHandler.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configProvider: ConfigProvider,
    private readonly i18n: I18nProvider,
  ) {
    // nothing to do
  }
  catch(exception: Error, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus == HttpStatus.INTERNAL_SERVER_ERROR) {
      if ('code' in exception) {
        const code = _.get(exception, 'code');
        if (errorCodesToIgnore[code as string]) {
          this.logger.log(`[${code}] - error`);
        } else {
          this.logger.error(`[${code}] ${exception.message}`, exception.stack);
        }
      } else if (exception instanceof Error) {
        this.logger.debug(exception);
        this.logger.error(exception.message, exception.stack);
      } else {
        this.logger.error(exception);
      }
    }
    const request = ctx.getRequest<Request>();
    const lang = request.headers['accept-language'] ?? request.headers['content-language'];

    if ('code' in exception && exception['code'] === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      this.logger.error(`File size too large: ${exception.message}`, exception.stack);
      const responseBody = {
        message: 'File size exceeds the allowable limit of 10MB',
        translated: this.i18n.translate('errors.file_too_large', { lang }),
        code: 'FILE_TOO_LARGE',
        errors: null,
      };
      httpAdapter.reply(ctx.getResponse<Response>(), responseBody, HttpStatus.BAD_REQUEST);
      return;
    }

    const responseBody = {
      message: this.configProvider.config.appEnv == 'local' ? exception.message : 'server_error',
      translated: this.i18n.translate('errors.server_error', { lang }),
      code: null,
      errors: null,
    };

    this.logger.verbose(`${httpStatus} Error: ${exception.message}`);

    httpAdapter.reply(ctx.getResponse<Response>(), responseBody, httpStatus);
  }
}
