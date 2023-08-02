import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { CodedUnauthorizedException } from '@/app/exceptions/errors/coded-unauthorized.exception';
import { I18nProvider } from '@/app/providers/i18n.provider';

/***
 * https://docs.nestjs.com/exception-filters
 */
@Catch(CodedInvalidArgumentException, CodedUnauthorizedException)
export class CodedExceptionHandler implements ExceptionFilter {
  private readonly logger = new Logger(CodedExceptionHandler.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly i18n: I18nProvider) {
    // nothing to do
  }

  // catch(exception: CodedInvalidArgumentException, host: ArgumentsHost) {
  //   this._catch(exception, host)
  // }

  /**
   * Decolatorの @Catch で指定された例外に対して処理を行う。
   */
  catch(exception: CodedInvalidArgumentException | CodedUnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof CodedInvalidArgumentException ? HttpStatus.BAD_REQUEST : HttpStatus.UNAUTHORIZED;
    const { httpAdapter } = this.httpAdapterHost;
    const codeForLocalize = `E-${exception.classCode}-${exception.info.typeCode}`;
    const lang = request.headers['accept-language'] ?? request.headers['content-language'];
    const translationTarget = `errors.${codeForLocalize}`;
    let translated = this.i18n.translate(translationTarget, { lang: lang ?? 'en' });
    if (translated == translationTarget) {
      translated = null;
    }

    this.logger.verbose(`4xx Error: ${exception.info.message}`);

    httpAdapter.reply(
      ctx.getResponse(),
      {
        message: exception.info.message,
        translated,
        code: `${codeForLocalize}-${exception.info.posCode}`,
        errors: null,
      },
      status,
    );
  }
}
