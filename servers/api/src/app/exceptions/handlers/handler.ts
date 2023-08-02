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

/***
 * https://docs.nestjs.com/exception-filters
 */
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

  // catch(exception: Error, host: ArgumentsHost) {
  //   this._catch(exception, host)
  // }

  /**
   * 一般の500エラーの処理を行う。
   */
  catch(exception: Error, host: ArgumentsHost) {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
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

    const responseBody = {
      message: this.configProvider.config.appEnv == 'local' ? exception.message : 'server_error',
      // https://nestjs-i18n.com/guides/exception-filters こちらを使った方がいいかも
      translated: this.i18n.translate('errors.server_error', { lang }),
      code: null,
      errors: null,
    };

    this.logger.verbose(`${httpStatus} Error: ${exception.message}`);

    httpAdapter.reply(ctx.getResponse<Response>(), responseBody, httpStatus);
  }
}
